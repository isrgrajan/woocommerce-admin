/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import interpolateComponents from 'interpolate-components';
import { withDispatch } from '@wordpress/data';
import { filter } from 'lodash';

/**
 * WooCommerce dependencies
 */
import { Card, H, Link } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import Logo from './logo';
import ManagementIcon from './images/management';
import SalesTaxIcon from './images/sales_tax';
import ShippingLabels from './images/shipping_labels';
import SpeedIcon from './images/speed';
import withSelect from 'wc-api/with-select';
import { recordEvent } from 'lib/tracks';
import { pluginNames } from 'wc-api/onboarding/constants';

class Benefits extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			isPending: false,
		};
		this.startPluginInstall = this.startPluginInstall.bind( this );
		this.skipPluginInstall = this.skipPluginInstall.bind( this );
	}

	componentDidUpdate( prevProps ) {
		const { goToNextStep, isRequesting } = this.props;
		const { isPending } = this.state;

		if ( ! isRequesting && prevProps.isRequesting && isPending ) {
			goToNextStep();
			this.setState( { isPending: false } );
		}
	}

	async skipPluginInstall() {
		const {
			activePlugins,
			createNotice,
			isProfileItemsError,
			updateProfileItems,
		} = this.props;

		this.setState( { isPending: true } );

		const plugins = activePlugins.includes( 'jetpack' )
			? 'skipped-wcs'
			: 'skipped';
		await updateProfileItems( { plugins } );

		if ( isProfileItemsError ) {
			createNotice(
				'error',
				__(
					'There was a problem updating your preferences.',
					'woocommerce-admin'
				)
			);
		} else {
			recordEvent( 'storeprofiler_install_plugins', {
				install: false,
				plugins,
			} );
		}
	}

	async startPluginInstall() {
		const { activePlugins, updateProfileItems, updateOptions } = this.props;

		this.setState( { isPending: true } );

		await updateOptions( {
			woocommerce_setup_jetpack_opted_in: true,
		} );

		const plugins = activePlugins.includes( 'jetpack' )
			? 'installed-wcs'
			: 'installed';
		recordEvent( 'storeprofiler_install_plugins', {
			install: true,
			plugins,
		} );
		updateProfileItems( { plugins } );
	}

	renderBenefit( benefit ) {
		const { description, icon, title } = benefit;

		return (
			<div className="woocommerce-profile-wizard__benefit" key={ title }>
				{ icon }
				<div className="woocommerce-profile-wizard__benefit-content">
					<H className="woocommerce-profile-wizard__benefit-title">
						{ title }
					</H>
					<p>{ description }</p>
				</div>
			</div>
		);
	}

	getBenefits() {
		const { activePlugins } = this.props;
		return [
			{
				title: __( 'Store management on the go', 'woocommerce-admin' ),
				icon: <ManagementIcon />,
				description: __(
					'Your store in your pocket. Manage orders, receive sales notifications, and more. Only with a Jetpack connection.',
					'woocommerce-admin'
				),
				visible: ! activePlugins.includes( 'jetpack' ),
			},
			{
				title: __( 'Automated sales taxes', 'woocommerce-admin' ),
				icon: <SalesTaxIcon />,
				description: __(
					'Ensure that the correct rate of tax is charged on all of your orders automatically, and print shipping labels at home.',
					'woocommerce-admin'
				),
				visible:
					! activePlugins.includes( 'jetpack' ) ||
					! activePlugins.includes( 'woocommerce-services' ),
			},
			{
				title: __( 'Improved speed & security', 'woocommerce-admin' ),
				icon: <SpeedIcon />,
				description: __(
					'Automatically block brute force attacks and speed up your store using our powerful, global server network to cache images.',
					'woocommerce-admin'
				),
				visible: ! activePlugins.includes( 'jetpack' ),
			},
			{
				title: __(
					'Print shipping labels at home',
					'woocommerce-admin'
				),
				icon: <ShippingLabels />,
				description: __(
					'Save time at the post office by printing shipping labels for your orders at home.',
					'woocommerce-admin'
				),
				visible:
					activePlugins.includes( 'jetpack' ) &&
					! activePlugins.includes( 'woocommerce-services' ),
			},
		];
	}

	renderBenefits() {
		return (
			<div className="woocommerce-profile-wizard__benefits">
				{ filter(
					this.getBenefits(),
					( benefit ) => benefit.visible
				).map( ( benefit ) => this.renderBenefit( benefit ) ) }
			</div>
		);
	}

	render() {
		const { activePlugins } = this.props;
		const { isPending } = this.state;

		const pluginsToInstall = [];
		if ( ! activePlugins.includes( 'jetpack' ) ) {
			pluginsToInstall.push( 'jetpack' );
		}
		if ( ! activePlugins.includes( 'woocommerce-services' ) ) {
			pluginsToInstall.push( 'woocommerce-services' );
		}
		const pluginNamesString = pluginsToInstall
			.map( ( pluginSlug ) => pluginNames[ pluginSlug ] )
			.join( ' & ' );

		return (
			<Card className="woocommerce-profile-wizard__benefits-card">
				<Logo />
				<H className="woocommerce-profile-wizard__header-title">
					{ __(
						'Enhance your store with Jetpack',
						'woocommerce-admin'
					) }
				</H>

				{ this.renderBenefits() }

				<p className="woocommerce-profile-wizard__tos">
					{ interpolateComponents( {
						mixedString: __(
							'By connecting your site you agree to our fascinating {{tosLink}}Terms of Service{{/tosLink}} and to ' +
								'{{detailsLink}}share details{{/detailsLink}} with WordPress.com. ',
							'woocommerce-admin'
						),
						components: {
							tosLink: (
								<Link
									href="https://wordpress.com/tos"
									target="_blank"
									type="external"
								/>
							),
							detailsLink: (
								<Link
									href="https://jetpack.com/support/what-data-does-jetpack-sync"
									target="_blank"
									type="external"
								/>
							),
						},
					} ) }
				</p>

				<Button
					isPrimary
					isBusy={ isPending }
					onClick={ this.startPluginInstall }
					className="woocommerce-profile-wizard__continue"
				>
					{ __( 'Get started', 'woocommerce-admin' ) }
				</Button>

				{ pluginsToInstall.length !== 0 && (
					<p>
						<Button
							isLink
							isBusy={ isPending }
							className="woocommerce-profile-wizard__skip"
							onClick={ this.skipPluginInstall }
						>
							{ sprintf(
								__( 'Proceed without %s', 'woocommerce-admin' ),
								pluginNamesString
							) }
						</Button>
					</p>
				) }
			</Card>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const {
			getProfileItemsError,
			getActivePlugins,
			getProfileItems,
			isGetProfileItemsRequesting,
		} = select( 'wc-api' );

		const isProfileItemsError = Boolean( getProfileItemsError() );
		const activePlugins = getActivePlugins();
		const profileItems = getProfileItems();

		return {
			isProfileItemsError,
			activePlugins,
			profileItems,
			isRequesting: isGetProfileItemsRequesting(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { updateProfileItems, updateOptions } = dispatch( 'wc-api' );
		const { createNotice } = dispatch( 'core/notices' );

		return {
			createNotice,
			updateProfileItems,
			updateOptions,
		};
	} )
)( Benefits );

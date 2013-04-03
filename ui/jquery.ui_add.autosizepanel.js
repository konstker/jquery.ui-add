/**
* $Id$
* jQuery UI Additions Autosizepanel 1.0.0
*
* Copyright (C) 2012-2013  Konstantin Kerentsev
* Dual licensed under the MIT and GPL licenses: 
*	http://www.opensource.org/licenses/mit-license.php 
*	http://www.gnu.org/licenses/gpl.html 
*
* Depends on:
*	jquery.ui.core.js
*	jquery.ui.widget.js
**/

(function( $, undefined ) {
	$.widget( 'ui_add.autosizepanel', {
		base_class			: 'ui_add-autosizepanel',
		browser				: 2,			// 0 - Quirks mode,
											// 1 - IE in Standards mode,
											// 2 - Non IE, CSS3 compliant browser
		ct					: null,
		ini					: null,
		options				: {
			disabled		: null,
			maxHeight		: Number.POSITIVE_INFINITY,
			maximized		: false,
			minHeight		: 0,
			resize			: $.noop,
			scroll			: $.noop,
			showHScrollBar	: true,
			showVScrollBar	: true
		},
		_check : function(){
			if ( $( '.' + this.base_class, this.element.parent()[0] ).length > 1 ) {
				throw 'Only single instance of the autosize panel allowed for the same parent node.';
			}
			else if ( ( this.options.minHeight > 0 ) && ( this.options.maxHeight > 0 ) && ( this.options.maxHeight < this.options.minHeight ) ) {
				throw 'The minimal height cannot be greater than maximal height.';
			}
		},
		_create : function() {
			var self = this;
			if( typeof( this.options.disabled ) !== 'boolean' ){
				this.options.disabled = !! this.element.attr( 'disabled' );
			}
			else {
				this.element.attr( 'disabled', this.options.disabled );
			}
			this.browser = window.innerHeight ? 2 : ( jQuery.support.shrinkWrapBlocks ? 0 : 1 );
			this._check();
			if( this.browser ){	// Non-IE browser and IE browser standards mode
				this.ini={
					height		: this.element.css( 'height' ),
					maxH		: parseInt( this.element.css( 'max-height' ) ) || 0,
					minH		: parseInt( this.element.css( 'min-height' ) ) || 0,
					overflow	: this.element.css( 'overflow' ),
					overflowX	: this.element.css( 'overflow-x' ),
					overflowY	: this.element.css( 'overflow-y' )
				};
				this.ct = this.element;
				this.element
					.addClass( this.base_class )
					.css( {
							'height' : 'auto',
							'overflow-x' : this.options.showHScrollBar ? 'auto' : 'hidden',
							'overflow-y' : this.options.showVScrollBar ? 'auto' : 'hidden'
					} )
					.bind( 'DOMSubtreeModified.' + this.widgetName, function(evt) {
						return self._fill( evt );
					} )
					/* IE specific handler*/
					.bind( 'propertychange.' + this.widgetName, function(evt) {
						if( ! ( ( evt.originalEvent.propertyName == 'height' ) || ( evt.originalEvent.propertyName == 'width' ) ) ) {
							return;
						}
						alert('Property change');
						return self._fill( evt );
					})
					.bind( 'resize.' + this.widgetName, function(evt) {
						alert('Element resize');
						return self._fill( evt );
					});
				$( window ).bind( 'resize',function(evt){
					return self._fill( evt );
				});
			}
			else {
				this.ini = {
					border		: {
						bottom	: this.element.css( 'border-bottom' ),
						left	: this.element.css( 'border-left' ),
						right	: this.element.css( 'border-right' ),
						top		: this.element.css( 'border-top' )
					},
					height		: this.element.css( 'height' ),
					margin		: this.element.css( 'margin' ),
					maxH		: parseInt( this.element.css( 'max-height' ) ) || 0,
					minH		: parseInt( this.element.css( 'min-height' ) ) || 0,
					overflow	: this.element.css( 'overflow' ),
					overflowX	: this.element.css( 'overflow-x' ),
					overflowY	: this.element.css( 'overflow-y' ),
					padding		: this.element.css( 'padding' )
				};
				this.ct = this.element.wrap( '<div style=\'overflow:hidden;overflow-x:hidden;overflow-y:hidden;\' />' ).parent()
					.css( {
						'border-bottom' : this.element.css( 'border-bottom' ),
						'border-left' : this.element.css( 'border-left' ),
						'border-right' : this.element.css( 'border-right' ),
						'border-top' : this.element.css( 'border-top' ),
						'margin' : this.element.css( 'margin' ),
						'padding' : this.element.css( 'padding' )
					} )
					.height( this.ini.height )
					.bind( 'scroll.' + this.widgetName, function(evt) {
						return self._scroll( evt );
					});
				this.element
					.addClass( this.base_class )
					.css( {
						'border' : '0px',
						'height' : '0',
						'margin' : '0px',
						'overflow-y' : 'visible',
						'overflow-x' : 'visible',
						'padding' : '0px'
					} )
					.add( window, this.ct.parent().not( 'body' ) )
					.bind( 'resize.' + this.widgetName, function(evt) {
						return self._fill( evt );
					} );
			}
			if ( this.ini.minH ){
				this.options.minHeight = this.ini.minH;
			}
			if ( this.ini.maxH ) {
				this.options.maxHeight = this.ini.maxH;
			}
			this._setOption( 'disabled', this.options.disabled );
			this._fill();
		},
		_fill : function( evt ){
			function maxY( obj ){
				var ret = 0;
				obj = obj || self.element.parent();
				$( obj ).children().each( function(ind, el){
					var pos = $( el ).css('position');
					if( ! ( ( pos === 'absolute' ) || ( pos === 'fixed' ) ) ) {
						ret = Math.max( ret ,( self.browser ? $( el ).position().top : $( el )[ 0 ].offsetTop ) + $( el ).outerHeight( true ) );
					}
				} );
				return ret;
			}
			if ( this.options.disabled ) {
				return false;
			}
			var d = 0,
				p = this.ct.parent(),
				ph = p.height(),
				pw = p.width(),
				cth = this.ct.height(),
				ctH = this.ct.outerHeight(),
				cw = this.ct.outerWidth( true ),
				oh = this.element.outerHeight(),
				self = this;

			if( p.is( 'body' ) ) {
				switch(this.browser){
					case 0:
						d = p.height();
						break;
					case 1:
						d = 2 * p.parent()[ 0 ].clientHeight - p.parent().height() - p.outerHeight() + p.height();
						break;
					default:
						d = window.innerHeight;
				}
				if ( ( d >= 0) && ( d !== ph ) ){
					ph = p.height( d ).height();
				}
			}
			try{
				if( this.browser ){
					if( p.is( 'body' ) ) {
						p.height( ! this.browser ? p[0].clientHeight : ( this.browser === 1 ? 2 * p.parent()[ 0 ].clientHeight - p.parent().height() - p.outerHeight() + p.height() : window.innerHeight - p.parent().height() + p.height() ) );
					}
					d = p.height() - maxY( p );
					d = ( ( d < 0 ) && ( cth + d < this.options.minHeight ) ? this.options.minHeight - cth : ( ( d > 0 ) && ( cth + d > this.options.maxHeight ) ? this.options.maxHeight - cth : d ) );
					this.ct.css('max-height',cth+d);
					if ( this.options.maximized ) {
						this.ct.css( 'height' , cth + d );
					}
					if ( ! self.options.showVScrollBar ) {
						self.ct.css( 'overflow-y', 'hidden' );
					}
					if ( ! self.options.showHScrollBar ) {
						self.ct.css( 'overflow-x', 'hidden' );
					}
					return !! d;
				}
				else {
					function resize( d ){
						// Quit if delta is equal zero
						if ( ! d ){
							return false;
						}
						// If container must shrink
						if( d < 0 ) {
							// Make vertical scroll bar visible, if was asked to do so
							var val = self.options.showVScrollBar ? 'auto' : 'hidden';
							if ( self.ct.css( 'overflow-y' ) !== val ) {
								self.ct.css( 'overflow-y', val );
							}
							// Make horizontal scroll bar visible, if was asked to do so
							val = self.options.showHScrollBar ? 'auto' : 'hidden';
							if ( self.ct.css( 'overflow-x' ) !== val ) {
								self.ct.css( 'overflow-x', val );
							}
							// If minimal height defined
							if ( self.options.minHeight > 0 ) {
								return cth !== self.ct.height( ctH + d < self.options.minHeight ? self.options.minHeight : ctH + d ).height();
							}
							else {
								return cth !== self.ct.height( ctH + d <= 0 ? 0 : ( ( self.options.maxHeight > 0 ) && ( ctH + d > self.options.maxHeight ) ? self.options.maxHeight : ctH + d ) ).height();
							}
						}
						else {
							var p = self.ct.parent(),
								ph = p.height(),
								mH = ph - maxY( p ) + ctH,	// Calculate the container maximal possible height
								nH = 0;
							// Re-calculate delta if it is too large
							if ( ctH + d > mH ) {
								d = mH - ctH;
							}
							if ( !d ) {
								return false;
							}
							// Calculate new height for the container
							//debugger;
							nH = ( self.options.maxHeight > 0 ) && ( ctH + d > self.options.maxHeight ) ? self.options.maxHeight : ctH + d;
							if ( nH === cth ){
								return false;
							}
							if ( self.ct.css( 'overflow-y' ) !== 'hidden' ) {
								self.ct.css( 'overflow-y', 'hidden' );
							}
							self.ct.height( nH );
							if ( self.options.showVScrollBar ){
								self.ct.css( 'overflow-y', 'auto' );
							}
							var val = self.options.showHScrollBar ? 'auto' : 'hidden';
							if ( self.ct.css( 'overflow-x' ) !== val ) {
								self.ct.css( 'overflow-x', val);
							}
							return self.ct.height() !== cth;
						}
					}
					// Take all unused space from the parent container
					if ( this.options.maximized ) {
						return resize( ph - maxY( p ) );
					}
					// Calculate the container maximal possible height
					var mH = ph - maxY( p ) + ctH;
					// Re-calculate delta if it is too large
					if ( ctH + d > mH ) {
						d = mH - ctH;
					}
					// If delta is negative - we are all set with calculations - shrink the container
					if ( d < 0 ) {
						return resize( d );
					}
					// Otherwise - check if children elements really need the additional space
					d = Math.min( maxY( this.element ), oh ) - cth;
					// If delta is zero - all children elements fit into the panel
					if ( ! d ) {
						return false;
					}
					// If delta is negative - we are all set with calculations - shrink the container
					if ( d < 0 ) {
						return resize( d );
					}
					// Grow the container to fit the panel in
					return resize( this.element.height() - cth );
				}
			}
			finally{
				this._trigger( 'resize', evt, this.ui() );
			}
		},
		_scroll : function( evt ){
			this._trigger( 'scroll', evt, this.ui() );
		},
		_setOption : function( key, value ){
			$.Widget.prototype._setOption.apply( this,arguments );
			if( ( key === 'maximized' ) || ( key === 'maxHeight' ) || ( key === 'minHeight' ) ) {
				this._fill();
			}
		},
		destroy : function(){
			this.element.removeClass( this.base_class );
			if( this.browser ){
				this.element.unbind( 'DOMSubtreeModified.' + this.widgetName );
				$( window ).unbind( 'resize.' + this.widgetName );
				this.element
					.css( {
						'height' : this.ini.height,
						'max-height' : this.ini.maxH,
						'min-height' : this.ini.minH,
						'overflow' : this.ini.overflow,
						'overflow-y' : this.ini.overflowX,
						'overflow-x' : this.ini.overflowY
					} );
			}
			else{
				this.element.add( window, this.ct.parent().not( 'body' )).unbind( 'resize.' + this.widgetName );
				this.element
					.unwrap()
					.css({
						'border-bottom' : this.ini.border.bottom,
						'border-left' : this.ini.border.left,
						'border-right' : this.ini.border.right,
						'border-top' : this.ini.border.top,
						'height' : this.ini.height,
						'margin' : this.ini.margin,
						'overflow' : this.ini.overflow,
						'overflow-y' : this.ini.overflowX,
						'overflow-x' : this.ini.overflowY,
						'padding' : this.ini.padding
					});
			}
			this.element.removeClass( this.base_class );
			$.Widget.prototype.destroy.call( this );
		},
		clientHeight:function(){
			return this.ct[0].clientHeight;
		},
		clientWidth:function(){
			return this.ct[0].clientWidth;
		},
		height: function(){
			return this.ct.height();
		},
		outerHeight: function(include_margin){
			return this.ct.outerHeight( include_margin );
		},
		outerWidth: function(include_margin){
			return this.ct.outerWidth( include_margin );
		},
		refresh:function(){
			return this._fill();
		},
		widget: function() {
			return this.element;
		},
		width: function(){
			return this.ct.width();
		},
		ui: function() {
			return {
				container: this.ct,
				element: this.element
			};
		}
	});
}(jQuery));

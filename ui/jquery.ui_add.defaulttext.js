/**
* $Id$
* jQuery UI Additions Defaulttext 1.0.1
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

( function( $, undefined ) {
	$.widget( 'ui_add.defaulttext', {
		options : {
			baseClass	: 'ui_add-defaulttext',
			behavior	: 'chrome',					// If browser does not support natively 'placeholder' attribute, then define behavior to mimic: chrome-like or the rest
			defaultText	: ''
		},
		_create : function() {
			var self=this;
			if( this._hasNativeSupport() ){
				this.element.prop( 'placeholder', this.options.defaultText );
				return;
			}
			if (this.element.is( ':text' )) {
				this.type = 'text';
			}
			this.element
				.bind( 'paste', function(){
					var timer=setTimeout(function(){
						clearTimeout(timer);
						var val=self._getValue();
						self._setValue( val === ''? self.options.defaultText : val );
					}, 0 );
				})
				.closest( 'form' ).submit(function() {
				if( self.options.defaultText === '' ) {
					return;
				}
				if( ! self.changed() ) {
					if ( self.type === 'text' ) {
						self.element.val( '' );
					}
					else {
						self.element.text( '' );
					}
				}
			});
			this._setBehavior( this.options.behavior );
			this._setValue( this.options.defaultText );
			if( typeof( this.options.disabled ) !== 'boolean' ){
				this.options.disabled = !! this.element.attr( 'disabled' );
			}
			else {
				this.element.attr( 'disabled', this.options.disabled );
			}
		},
		changed : function(){
			return this._getValue() !== '';
		},
		destroy : function(){
			this.element.removeClass( this.options.baseClass );
			$.Widget.prototype.destroy.call( this );
		},
		_getValue : function(){
			var val = this.type === 'text' ? this.element.val() : this.element.text();
			if ( this.options.defaultText === '' ) {
				return val;
			}
			if ( this.options.defaultText === val ) {
				return '';
			}
			return val;
		},
		_setValue : function( value ){
			if ( value === this.options.defaultText ) {
				if ( this.type === 'text' ) {
					this.element.val( value );
				}
				else {
					this.element.text( value );
				}
				this.element.addClass( this.options.baseClass );
			}
			else {
				if ( this.type === 'text' ) {
					this.element.val( value );
				}
				else {
					this.element.text( value );
				}
				this.element.removeClass( this.options.baseClass );
			}
		},
		val : function() {
			if ( arguments.length ){
				this._setValue( arguments[0] === '' ? this.options.defaultText : arguments[0] );
			}
			else {
				return this._getValue();
			}
		},
		widget : function() {
			return this.element;
		},
		_hasNativeSupport : function(){
			return this.element.prop( 'placeholder' ) !== undefined;
		},
		_setBehavior : function( behavior ){
			function _isSpecialKey( key ){
				switch( key ){
					case $.ui.keyCode.BACKSPACE:
					case $.ui.keyCode.DELETE:
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.END:
					case $.ui.keyCode.ENTER:
					case $.ui.keyCode.ESCAPE:
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.LEFT:
					case $.ui.keyCode.PAGE_DOWN:
					case $.ui.keyCode.PAGE_UP:
					case $.ui.keyCode.RIGHT:
					case $.ui.keyCode.UP:
						return true;
					default:
						return false;
				}
			}
			if( this._hasNativeSupport() ) {
				return false;
			}
			var flst = ( behavior === 'chrome' ? 
						[ null, 'focusin.', 'focusout.', 'keydown.', 'keyup.', ' blur.' ] : 
						[ 'keydown.', 'keyup.', ' blur.', 'focusin.', 'focusout.', null ] ),
				self=this;
			if ( flst[0] ) {
				this.element.unbind( flst[0] + this.widgetName );
			}
			this.element
				.unbind( flst[1] + this.widgetName )
				.unbind( flst[2] + this.widgetName )
				.bind( flst[3] + this.widgetName, function( event ){
					if ( self.options.disabled || ( self.options.defaultText === '' ) ) {
						return false;
					}
					if ( ! self.changed() ) {
						if ( behavior === 'chrome' ) {
							if ( _isSpecialKey( event.keyCode ) || ( event.altKey && ( event.keyCode === 18 ) ) || ( event.ctrlKey && ( event.keyCode === 17 ) ) || ( event.shiftKey && ( event.keyCode === 16 ) ) ) {
								return false;
							}
							if ( event.keyCode === $.ui.keyCode.TAB ) {
								return;
							}
						}
						self._setValue( '' );
					}
				} )
				.bind( flst[4] + this.widgetName + ( flst[5] ? ' ' + flst[5] + this.widgetName : '' ), function( event ){
					if ( self.options.disabled || ( self.options.defaultText === '' ) ) {
						return false;
					}
					if ( ! self.changed() ) {
						self._setValue( self.options.defaultText );
					}
				});
		},
		_setOption : function( key, value ){
			if ( ( key === 'baseClass' ) && this.element.hasClass( this.options.baseClass ) ) {
				this.element
					.removeClass( this.options.baseClass )
					.addClass( value );
			}
			else if ( key === 'behavior' ) {
				this._setBehavior( value );
			}
			else if ( key === 'defaultText' ) {
				var oldval = this._getValue();
				this.options.defaultText = value;
				if ( oldval === '' ) {
					self._setValue( self.options.defaultText );
				}
			}
			$.Widget.prototype._setOption.apply( this, arguments );
		}
	});
}( jQuery ) );

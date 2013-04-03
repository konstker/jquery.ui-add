/**
* $Id$
* jQuery UI Additions Sortable 1.0.0
*
* Copyright (C) 2012-2013  Konstantin Kerentsev
* Dual licensed under the MIT and GPL licenses: 
*	http://www.opensource.org/licenses/mit-license.php 
*	http://www.gnu.org/licenses/gpl.html 
*
* Depends on:
*	jquery.ui.widget.js
**/

( function( $, undefined ) {
    $.widget( 'ui_add.sortable', {
        items : null,
        original : null,
        options : {
            baseClass : 'ui-add-sortable',
            // Calculate sort values used for sorting once and re-use them. Or calculate them every time.
            cacheValues : true,
            // The attribute name where to store calculated sort value
            cacheAttrName : 'sort_value',
            // Is it a case-sensitive sort
            caseSensitive : false,
            disabled : null,
            // The class name for items excluded from sorting
            fixedItemClass : 'non-sortable',
            // Currency regular expression. Change it if you need different currency localization
            currencyRegex : /^(?:(?:\(\s*\$((?:\d+\.?\d*)|(?:\d*\.?\d+))\s*\))|(?:\$((?:\d+\.?\d*)|(?:\d*\.?\d+))))\s*$/,
            // Selector used to get child elements for sorting
            sortItemSelector : 'tbody tr'
        },
        _create : function() {
            this.element.addClass( this.options.baseClass );
            this.refresh();
        },
        _setOption : function( key, value ) {
            $.Widget.prototype._setOption.apply( this, arguments );
            if ( key === 'sortItemSelector' ) {
                this.refresh();
            }
        },
        destroy : function() {
            if ( this.options.cacheValues ) $( '*[' + this.options.cacheAttrName + ']', this.element ).removeAttr( this.options.cacheAttrName );
            this.element.removeClass( this.options.baseClass );
            $.Widget.prototype.destroy.call( this );
            return this;
        },
        refresh : function() {
            this.original = $( this.options.sortItemSelector, this.element ).not( this.options.fixedItemClass );
            if ( this.options.cacheValues ) $( '*[' + this.options.cacheAttrName + ']', this.element ).removeAttr( this.options.cacheAttrName );
        },
        reverse : function() {
            if ( !this.items ) return;
            var parent = this.original.parent();
            this.items.reverse();
            for( var i=0, cnt = this.items.length; i<cnt; ++i ){
				parent.append( this.items[i].item );
            }
        },
        /*
		 * Generic sorting function
		 * PARAMETERS:
		 *	[selector]		- selector used to get child DOM element to calculate sort value from or to pickup sort values from
		 *	[order]			- optional, sort order 1 - ascending (default) or -1 - descending
		 *	[getSortValueFn]- optional, callback function used in case of sort value cache does not exists or cache is not allowed
		 *	[handler]		- optional, 
		 *					  (default) if empty - the data autodetect type functionality and the internal compare function will be used 
		 *					  if sort value type passed (integer, 0..6) force use of the internal compare function for the selected type
		 *					  callback function used to compare sort values. Used for user-defined sorting orders.
         */
        sort : function(selector, order, getSortValueFn, handler) {


            /* The function trying to guess the type of the supplied data.
			 * PARAMETERS:
			 *	 value		- data sample to guess the type from
             * RETURN:
             *   0	- empty
             *   1	- string
             *   2	- date (with or without time)
             *   3	- time only
             *   4	- short date
             *   5	- number
             *   6	- currency
             */
            function getType( value ) {
				if ( ( value === undefined ) || ( value === null ) ) {
					return 0;
				}
				value = $.trim( value.toString() );
				if ( value === '') {
					return 0;
				}
				else if ( self.options.currencyRegex.test( value ) ) {
					return 6;
				}
				else if ( $.ui_add.isNumber( value ) ) {
					return 5;
				}
				else if ( $.ui_add.isShortDate( value ) ) {
					return 4;
				}
				else if ( $.ui_add.isTime( value ) ) {
					return 3;
				}
				else if ( $.ui_add.isDate( value ) ) {
					return 2;
				}
				return 1;
            }

            /* Default callback function for comparing the sorting values.
			 * PARAMETERS:
			 *	a,b		- values to compare
             * RETURN:	-1 if a < b
             *			 0 if a === b
             *			 1 if a > b
			 */
            function compare_cb(a, b) {
				var v1 = a.value,
					v2 = b.value;
				switch ( type ) {
					case 5:
						v1 = parseFloat( v1 );
						v2 = parseFloat( v2 );
						break;
					case 6:
						var arr = v1.match( self.options.currencyRegex );
						if ( arr ) v1 = !! arr[1] ? parseFloat( arr[1] ) * -1 : parseFloat( arr[2] );
						arr = v2.match( self.options.currencyRegex );
						if ( arr ) v2 = !! arr[1] ? parseFloat( arr[1] ) * -1 : parseFloat( arr[2] );
						break;
					case 3:
						v1 = $.ui_add.toTimeTicks( v1 );
						v2 = $.ui_add.toTimeTicks( v2 );
						break;
					case 2:
					case 4:
						v1 = $.ui_add.toTicks( v1 );
						v2 = $.ui_add.toTicks( v2 );
				}
				return ( v1 < v2 ? -1 : v1 > v2 ? 1 : 0 ) * order;
            }
			if ( this.options.disabled ) {
				return false;
			}
			var autodetect = false,
				parent = this.original.parent(),
				self = this,
				type = null;
			// To make the stable sort ( see https://en.wikipedia.org/wiki/Sorting_algorithm ) take items with original order
			this.items = $( $.makeArray( this.original ) );
			if ( !this.items.length ) {
				return true;
			}
			order = parseInt(order);
			if ( isNaN( order ) || !order ) {
				order = 1;
			}
			else {
				order = order < 0 ? -1 : 1;
			}
			if ( $.ui_add.isInteger( handler ) && ( handler >= 0 ) && ( handler <= 6 )) {
				type = handler > 0 ? handler : 1;
				handler = type > 1 ? compare_cb : null;
			} else if ( typeof( handler ) !== 'function' ) {
				autodetect = true;
				handler = null;
			}
			this.items = $.makeArray(
				this.items.map( function(ind, el) {
					var ctype = null,
						svitem = $.trim( selector ) !== '' ? $( selector, el ) : $( el ),
						val = null;
					// Take a sort value from cache or calculate it and cache it
					if ( self.options.cacheValues ) {
						val = svitem.data( self.options.cacheAttrName );
						if (val === undefined) {
							val = $.trim( typeof( getSortValueFn ) === 'function' ? getSortValueFn( svitem ) : svitem.text() );
							if ( ( typeof( val ) === 'string' ) && !self.options.caseSensitive ) {
								val = val.toLowerCase();
							}
							svitem.data( self.options.cacheAttrName, val );
						}
					}
					// Calculate sort value
					else {
						val = typeof( getSortValueFn ) === 'function' ? $.trim( getSortValueFn( svitem ) ) : null;
						if ( ( typeof( val ) === 'string' ) && !self.options.caseSensitive) {
							val = val.toLowerCase();
						}
					}
					if ( autodetect && ( !type || ( type > 1 ) ) ) {
						ctype = getType( val );
						if ( !type ) {
							type = ctype;
						}
						else if ( ( type > 1 ) && ctype && ( ctype !== type )) {
							// If type autodetect detects different types in sort values we cannot compare them, until we downgrade type to string
							type = 1;
							handler = null;
						}
					}
					return {
						item: el,
						value: val,
						toString: function() {
							return val;
						}
					};
				})
			);
			if ( type === 1 ) {
				this.items.sort();
			}
			else if ( typeof(handler) === 'function' ) {
				this.items.sort( handler );
			}
			else {
				this.items.sort( compare_cb );
			}
            for( var i=0, cnt = this.items.length; i<cnt; ++i ){
				parent.append( this.items[i].item );
            }
			return true;
        },
        widget: function() {
            return this.element;
        }
    });
}(jQuery));

( function( $, undefined ) {
    $.ui_add = $.ui_add || {};
    $.extend( $.ui_add, {
        isDate : function( obj ) {
            return ( obj !== undefined ) && !$.ui_add.isNumber( obj ) && !isNaN( Date.parse( obj ) );
        },
        isInteger : function( obj ) {
            if ( !obj ) {
				return false;
			}
            var val = parseInt( obj );
            return !isNaN( val ) && ( val.toString() === obj.toString() );
        },
        isNumber : function( obj ) {
            if ( !obj ) {
				return false;
			}
            var val = parseFloat( obj );
            if ( isNaN( val ) ) {
				return false;
			}
			return val.toString() === obj.toString();
        },
        isShortDate : function( obj ) {
            if ( !obj ) {
				return false;
			}
            var dt = Date.parse( obj );
            if ( isNaN( dt ) ) {
				return false;
			}
			// If test returns true - it is a full year, short otherwise
            return !( new RegExp( '(?:19|20)' + $.ui_add.padl( ( new Date( dt ) ).getFullYear() % 100, 2, '0' ) ) ).test( obj );
        },
        isTime : function( obj ) {
            if ( !obj ) {
				return false;
			}
            var re = /^(?:(?:(?:[0]{1,2}|[0]?[1-9]|1[0-2])(?::[0-5][0-9]){1,2}[ ]?[AaPp][Mm])|(?:(?:[0]{1,2}|[0]?[0-9]|1[0-9]|2[0-3])(?::[0-5][0-9]){1,2}))/;
            if ( ! re.test( $.trim( obj ) ) ) {
				return false;
            }
            if ( isNaN( Date.parse( '01/01/1970 ' + $.trim( obj ) ) ) ) {
				return false;
            }
            return true;
        },
		padl : function( str, length, chr ){
			var arr = new Array( length );
			arr.push( str );
			str = arr.join( chr );
			return str.substr( str.length - length );
		},
		padr : function( str, length, chr ){
			var arr = new Array( length + 1 );
			arr[0] = str;
			return arr.join( chr ).substr( 0, length );
		},
        toTicks : function( obj ) {
            return $.ui_add.isDate( obj ) ? Date.parse( obj ) : null;
        },
        toInteger : function( obj ) {
            return $.ui_add.isInteger( obj ) ? parseInt( obj ) : null;
        },
        toNumber : function( obj ) {
            return $.ui_add.isNumber( obj ) ? parseFloat( obj ) : null;
        },
        toTimeTicks : function( obj ) {
			var timeonly = $.ui_add.isTime( obj );
			if ( ! ($.ui_add.isDate( obj ) || $.ui_add.isShortDate( obj ) || timeonly ) ) {
				return null;
			}
			if ( timeonly ) {
				var re = /^(?:(?:(?:[0]{1,2}|[0]?[1-9]|1[0-2])(?::[0-5][0-9]){1,2}[ ]?[AaPp][Mm])|(?:(?:[0]{1,2}|[0]?[0-9]|1[0-9]|2[0-3])(?::[0-5][0-9]){1,2}))$/;
				return Date.parse( '01/01/1970 ' + obj + ( re.test( $.trim( obj ) ) ? ' GMT' : '' ) );
			}
			return Date.parse( '01/01/1970 ' + ( new Date( Date.parse( obj ) ) ).toLocaleTimeString() + ' GMT' );
        }
	} );
} )( jQuery );
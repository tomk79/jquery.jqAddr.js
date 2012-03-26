/**
 * jquery.jqAddr.js
 * 物理的なURLにあるHTMLコンテンツを、
 * ハッシュによる仮想的なURLで表現する。
 * 
 * UTODO:
 * ・コンテンツ内のハッシュ付きリンクに対応する
 * ・フォーム送信に対応する
 * 
 * @author Tomoya Koyanagi
 */
(function(jQuery){
	var conf = {
		sitemap: {} ,
		classCurrent: 'current' ,
		basePath: '/' ,
		copySelectors: [],
		breadcrumb: null
	};

	var initBodyCond = {id:'',className:''};
	var baseUrl;

	/*
	* ドメイン部分をトルツメる
	*/
	function trimDomain( url ){
		url = url.replace(new RegExp('^https?\://.*?/','is'),'/');
		return url;
	}

	/*
	* 正規表現メタ文字をエスケープする
	*/
	function regQuot( str ){
		str = str.replace(new RegExp('(\\.|\\-|\\:|\\~|\\^|\\$|\\\\|\\(|\\)|\\[|\\]|\\{|\\}|\\?|\\/|\\|)','ig'),'\\$1');
		return str;
	}

	/*
	* URLを要素分解する
	*/
	function parseUrl( url ){
		var RES = {url:url};
		if(url.match(new RegExp('^([a-zA-Z0-9]*?)\://(.*?)(?:\:([0-9]+))?(/.*)$','i'))){
			RES.scheme = RegExp.$1;
			RES.host   = RegExp.$2;
			RES.port   = RegExp.$3;
			url = RegExp.$4;
		}else{
			RES = parseUrl(window.location.href);
			RES.url = url;
		}

		if(url.match(new RegExp('^(.*?)(?:\#(.*))?$','i'))){
			url = RegExp.$1;
			RES.hash   = RegExp.$2;
		}

		if(url.match(new RegExp('^(.*?)(?:\\?(.*))?$','i'))){
			RES.path   = RegExp.$1;
			RES.query  = RegExp.$2;
		}

		RES.getUrl = function(){
			var URL = '';
			URL += this.scheme+'://'+this.host+(this.port?':'+this.port:'')+this.path+(this.query?'?'+this.query:'')+(this.hash?'#'+this.hash:'');
			return URL;
		};

		RES.toString = function(){
			var RTN = '';
			for(var key in this){ if(typeof(this[key])==typeof(function(){})){continue;} RTN += '['+key+':] '+this[key]+"\n"; }
			return RTN;
		};
		return RES;
	}
	jQuery.jqAddrParseUrl = parseUrl;

	/*
	* 文字列をid属性に設定できる形に変換する
	*/
	function str2Id(str){
		str = str.replace(new RegExp('[^a-zA-Z0-9\-\_]','g'),'_');
		return str;
	}

	/*
	* 設定値を取得する
	*/
	jQuery.jqAddrConf = function( key ){
		return conf[key];
	}

	/*
	* 初期化
	*/
	jQuery.jqAddrInit = function( option ){
		for( var key in option ){
			conf[key] = option[key];
		}

		baseUrl = window.location.href.replace( new RegExp('^(https?\://.*?)/.*$','i') , '$1' ) + jQuery.jqAddrConf('basePath');

		var body = $('body');
		body.jqAddrAttch();
		initBodyCond.id = body[0].id;
		initBodyCond.className = body[0].className;

		if( window.location.hash && window.location.hash.length ){
			jQuery.jqAddrInitGo();
		}
	}

	/*
	* 初期遷移アクション
	*/
	jQuery.jqAddrInitGo = function(){
		jQuery.jqAddrGoTo( jQuery.jqAddrGetUrl() );
		return true;
	}

	/*
	* 現在のコンテンツのパスを取得
	*/
	jQuery.jqAddrGetUrl = function(){
		var url = window.location.href;
		url = trimDomain( url );
		url = url.replace('/#/','/');
		return url;
	}

	/*
	* 現在のページ情報を取得
	*/
	jQuery.jqAddrGetPageInfo = function( Url ){
		if( !Url ){ Url = jQuery.jqAddrGetUrl(); }
		if( jQuery.jqAddrConf('sitemap')[Url] ){
			return jQuery.jqAddrConf('sitemap')[Url];
		}
		return false;
	}

	/*
	* 指定のURLに遷移する
	*/
	jQuery.jqAddrGoTo = function( href ){
		href = trimDomain( href );
		href = href.replace( jQuery.jqAddrConf('basePath') , '/' );
		window.location.hash = href;
		jQuery.jqAddrNowLoading();
		jQuery.ajax( {
			url: jQuery.jqAddrGetUrl() ,
			success : function( fullContent ){
				var all = jQuery( fullContent );

				//ナビゲーション表示を更新する
				jQuery.jqAddrUpdateNavi( fullContent );

				//タイトルをコピー
				document.title = jQuery('title','<jqxhr>'+fullContent+'</jqxhr>').text();

				//コンテンツをコピー
				for( var i = 0; i < jQuery.jqAddrConf('copySelectors').length; i ++ ){
					jQuery(jQuery.jqAddrConf('copySelectors')[i][1]).html( $(jQuery.jqAddrConf('copySelectors')[i][0],all).html() ).jqAddrAttch();
				}

				//演出を起動
				jQuery.jqAddrApplyContent( fullContent );
			} ,
			error : function(){
				alert('Error!');
			}
		} );
		return true;
	}

	/*
	* 読み込み中の演出
	*/
	jQuery.jqAddrNowLoading = function(){
		/* override */
	}

	/*
	* 指定のURLに遷移する演出
	*/
	jQuery.jqAddrApplyContent = function( fullContent ){
		/* override */
	}

	/*
	* ナビゲーション表示を更新する
	*/
	jQuery.jqAddrUpdateNavi = function( fullContent ){
		var body = $('body');
		body[0].id = initBodyCond.id;
		body[0].className = initBodyCond.className;

		targetUrls = [];
		targetUrls.push( jQuery.jqAddrGetUrl() );
		if( jQuery.jqAddrConf('breadcrumb') ){
			var ca = jQuery(jQuery.jqAddrConf('breadcrumb')+' a',fullContent);
			for( var i=0; ca[i]; i ++ ){
				targetUrls.push( trimDomain( ca[i].href ) );
			}//for
		}

		var a = jQuery('a');
		a.removeClass(jQuery.jqAddrConf('classCurrent'));
		var current = jQuery.jqAddrGetPageInfo( jQuery.jqAddrGetUrl() );
		if( current.bodyId ){
			jQuery('body').attr( 'id' , str2Id(current.bodyId) );
		}

		//パンくず上のページへのリンクをactive表示に
		for( var url in targetUrls ){
			for( var i=0; a[i]; i ++ ){
				if( trimDomain( a[i].href ) == targetUrls[url] ){
					jQuery(a[i]).addClass(jQuery.jqAddrConf('classCurrent'));
				}
				var pageInfo = jQuery.jqAddrGetPageInfo( targetUrls[url] );
				if( pageInfo.bodyClass ){
					jQuery('body').addClass( str2Id(pageInfo.bodyClass) );
				}
			}//for
		}//for
	}

	/*
	* リンクのonclickアクションを設定する。
	*/
	jQuery.fn.jqAddrAttch = function(){
		var clickFncADef = function(){
			jQuery.jqAddrGoTo(this.href);
			return false;
		}//clickFncADef()

		var tagNames = ['a','area'];
		var memoRegQuotedBaseUrl = regQuot(baseUrl);
		for( var tagName in tagNames ){
			var jqElm = jQuery( tagNames[tagName] , this );
			for( var i = 0; i < jqElm.size(); i ++ ){
				var curAElm = jqElm[i];
				if( curAElm.href.match(new RegExp('^(?:javascript\:|mailto\:)','gi')) ){
					continue;
				}
				if( !curAElm.href.match(new RegExp('^'+memoRegQuotedBaseUrl,'')) ){
					continue;
				}
				jQuery(curAElm).click(clickFncADef);
			}
		}
	}

})(jQuery);
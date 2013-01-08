(function() {
	
	document.observe('chinachu:reload', function() {
		document.stopObserving('chinachu:reload', arguments.callee);
		document.stopObserving('chinachu:schedule', viewSchedule);
		clearInterval(viewScheduleDatePollingInterval);
	});
	
	var contentBodyHead           = $('content-body-head');
	var contentBodyTimescale      = $('content-body-timescale');
	var contentBodyTimeline       = $('content-body-timeline');
	var contentBodyTimelineHeader = $('content-body-timeline-header');
	
	var param = {
		unit        : parseInt(window.localStorage.getItem('schedule-param-unit') || 25, 10),
		line        : parseInt(window.localStorage.getItem('schedule-param-line') || 50, 10),
		types       : eval(window.localStorage.getItem('schedule-param-types') || "['GR','BS','CS','EX']"),
		categories  : eval(window.localStorage.getItem('schedule-param-categories') || "['anime', 'information', 'news', 'sports', 'variety', 'drama', 'music', 'cinema', 'etc']"),
		hideChannels: eval(window.localStorage.getItem('schedule-param-hide-channels') || "[]"),
		color       : {
			anime      : '#fcbde1',
			information: '#bdfce8',
			news       : '#d7fcbd',
			sports     : '#bdf1fc',
			variety    : '#fbfcbd',
			drama      : '#fce1c4',
			music      : '#bdc9fc',
			cinema     : '#d6bdfc',
			etc        : '#eeeeee'
		},
		dateIndex  : [],
		dateBtns   : [],
		points     : [0, 0],
		isScrolling: false,
	};
	
	// 設定ボタン
	var viewConfigBtn = new Element('a', { className: 'right' }).insert(
		'ビュー設定'
	);
	
	var viewConfigBtnOnClick = function() {
		var modal = new Hypermodal({
			title  : 'ビュー設定',
			content: new Element('div'),
			buttons: [
				{
					label  : '保存',
					color  : '@pink',
					onClick: function(e, btn, modal) {
						btn.disable();
						
						var result = viewConfigForm.result();
						
						param.unit         = result.unit;
						param.line         = result.line;
						param.types        = result.types;
						param.categories   = result.categories;
						param.hideChannels = result.hideChannels;
						
						window.localStorage.setItem('schedule-param-unit', param.unit.toString(10));
						window.localStorage.setItem('schedule-param-line', param.line.toString(10));
						window.localStorage.setItem('schedule-param-types', Object.toJSON(param.types));
						window.localStorage.setItem('schedule-param-categories', Object.toJSON(param.categories));
						window.localStorage.setItem('schedule-param-hide-channels', Object.toJSON(param.hideChannels));
						
						modal.close();
						viewSchedule();
					}
				},
				{
					label  : 'キャンセル',
					onClick: function(e, btn, modal) {
						modal.close();
					}
				}
			]
		}).render();
		
		var viewConfigForm = new Hyperform({
			formWidth  : '100%',
			labelWidth : '100px',
			labelAlign : 'right',
			fields     : [
				{
					key   : 'unit',
					label : '長さ',
					input : {
						type : 'radio',
						items: [
							{
								label     : '50%',
								value     : 13,
								isSelected: (param.unit === 13)
							},
							{
								label: '100%',
								value: 25,
								isSelected: (param.unit === 25)
							},
							{
								label: '200%',
								value: 50,
								isSelected: (param.unit === 50)
							}
						]
					}
				},
				{
					key   : 'line',
					label : '高さ',
					input : {
						type : 'radio',
						items: [
							{
								label     : '50%',
								value     : 25,
								isSelected: (param.line === 25)
							},
							{
								label: '100%',
								value: 50,
								isSelected: (param.line === 50)
							},
							{
								label: '200%',
								value: 100,
								isSelected: (param.line === 100)
							}
						]
					}
				},
				{
					key   : 'types',
					label : 'タイプ',
					input : {
						type : 'checkbox',
						items: (function() {
							var array = [];
							
							['GR', 'BS', 'CS', 'EX'].each(function(a) {
								array.push({
									label     : a,
									value     : a,
									isSelected: (param.types.indexOf(a) !== -1)
								});
							});
							
							return array;
						})()
					}
				},
				{
					key   : 'categories',
					label : 'カテゴリー',
					input : {
						type : 'checkbox',
						items: (function() {
							var array = [];
							
							[
								'anime', 'information', 'news', 'sports',
								'variety', 'drama', 'music', 'cinema', 'etc'
							].each(function(a) {
								array.push({
									label     : a,
									value     : a,
									isSelected: (param.categories.indexOf(a) !== -1)
								});
							});
							
							return array;
						})()
					}
				},
				{
					key   : 'hideChannels',
					label : '隠すチャンネルID',
					input : {
						type  : 'tag',
						values: param.hideChannels
					}
				}
			]
		}).render(modal.content);
	};
	
	// 目盛のポインタ
	var pointer = new Element('div', { className: 'timescale-pointer' }).setStyle({
		left: '-1px'
	});
	
	function timelineOnMousedown() {
		param.isScrolling = true;
	}
	
	function timelineOnMouseup() {
		param.isScrolling = false;
	}
	
	function timelineOnMouseout() {
		pointer.style.left = '-1px';
		pointer.innerHTML  = '';
	}
	
	function timelineOnMousemove(e) {
		var points = [ e.x || e.pageX, e.y || e.pageY ];
		
		if (param.isScrolling) {
			contentBodyTimelineHeader.scrollTop = contentBodyTimeline.scrollTop = contentBodyTimeline.scrollTop + param.points[1] - points[1];
			var position = contentBodyTimescale.scrollLeft = contentBodyTimeline.scrollLeft = contentBodyTimeline.scrollLeft + param.points[0] - points[0];
			position += points[0];
		} else {
			var position = contentBodyTimeline.scrollLeft + points[0];
		}
		
		param.points = [ points[0], points[1] ];
		
		pointer.style.left = position + 'px';
		pointer.innerHTML  = ':' + new Date(param.cur + ((position - 150) / param.unit * 1000 * 1000)).getMinutes().toPaddedString(2);
	}
	
	function timelineOnScroll(e) {
		var scrollLeft = contentBodyTimeline.scrollLeft;
		
		contentBodyTimescale.scrollLeft = scrollLeft;
		contentBodyTimelineHeader.scrollTop = contentBodyTimeline.scrollTop;
	}
	
	if (Prototype.Browser.MobileSafari) {
		contentBodyTimeline.style.overflow = 'scroll';
		contentBodyTimeline.addEventListener('scroll', timelineOnScroll);
	} else if(Prototype.Browser.IE) {
		contentBodyTimeline.attachEvent('onmousemove', timelineOnMousemove);
		contentBodyTimeline.attachEvent('onmouseout', timelineOnMouseout);
		contentBodyTimeline.attachEvent('onmousedown', timelineOnMousedown);
		contentBodyTimeline.attachEvent('onmouseup', timelineOnMouseup);
		contentBodyTimelineHeader.attachEvent('onmousemove', timelineOnMousemove);
		contentBodyTimelineHeader.attachEvent('onmouseup', timelineOnMouseup);
	} else {
		contentBodyTimeline.addEventListener('mousemove', timelineOnMousemove);
		contentBodyTimeline.addEventListener('mouseout', timelineOnMouseout);
		contentBodyTimeline.addEventListener('mousedown', timelineOnMousedown);
		contentBodyTimeline.addEventListener('mouseup', timelineOnMouseup);
		contentBodyTimelineHeader.addEventListener('mousemove', timelineOnMousemove);
		contentBodyTimelineHeader.addEventListener('mouseup', timelineOnMouseup);
	}
	
	// ビュー: スケジュール
	function viewSchedule() {
		if (app.chinachu.schedule.length === 0) return;
		
		var loading = new app.ui.ContentLoading({
			onComplete: function() {
				loading.remove();
				loading = null;
				
				app.chinachu.reserves.each(function(program) {
					if (typeof piece[program.id] === 'undefined') return;
					
					piece[program.id].title.color = '#ff7244';
				});
				
				app.chinachu.recording.each(function(program) {
					if (typeof piece[program.id] === 'undefined') return;
					
					piece[program.id].title.color = '#f44';
				});
				
				stage.update();
			}
		}).render();
		
		var total  = 0;
		var count  = 0;
		var maxlen = 0;
		
		function counter() {
			++count;
			loading.update(Math.floor(count / total * 100));
		}
		
		param.cur = new Date().getTime();
		
		contentBodyHead.update();
		contentBodyTimescale.update();
		contentBodyTimeline.update();
		contentBodyTimelineHeader.update();
		
		var piece = {};// piece of canvas programs
		
		var canvas = new Element('canvas');
		contentBodyTimeline.insert(canvas);
		
		var stage = new createjs.Stage(canvas);
		
		var k = 0;
		app.chinachu.schedule.each(function(channel, i) {
			if (channel.programs.length === 0) return;
			if (param.types.indexOf(channel.type) === -1) return;
			if (param.hideChannels.indexOf(channel.id) !== -1) return;
			
			var y = k;
			
			var header = new Element('div');
			header.addClassName('channel-type-' + channel.type).addClassName('channel-id-' + channel.id);
			header.setStyle({
				height: param.line + 'px'
			});
			
			if (param.line >= 50) {
				header.insert(new Element('div', { className: 'name' }).insert(channel.name));
				header.insert(new Element('div', { className: 'meta' }).insert(channel.id + ' (' + channel.channel + ')'));
			} else {
				header.insert(new Element('div', { className: 'name' }).insert(channel.name).setStyle({ marginTop: '3px' }));
			}
			
			header.observe('click', function() {
				window.location.hash = '/search?' + Object.toQueryString({ skip: 1, chid: channel.id });
			});
			
			contentBodyTimelineHeader.insert(header);
			
			channel.programs.each(function(program, j) {
				if ((program.end - param.cur) < 0) {
					channel.programs = channel.programs.without(program);
					return;
				}
				
				if (maxlen < program.end) maxlen = program.end;
				
				var points = [0, 0];
				
				setTimeout(function() {
					var posX   = (program.start - param.cur) / 1000 / 1000 * param.unit + 150;
					var posY   = 5 + y * (5 + param.line);
					var width  = program.seconds / 1000 * param.unit;
					var height = param.line;
					
					var rect = new createjs.Shape();
					rect.graphics.beginFill(param.color[program.category] || '#fff').drawRect(posX, posY, width, height);
					stage.addChild(rect);
					
					var title = new createjs.Text(program.title, '10px', "#444");
					title.mask = rect;
					title.x    = posX + 5;
					title.y    = posY + 5;
					stage.addChild(title);
					
					if (param.line >= 50) {
						var desc = new createjs.Text(program.detail || '', '10px', "rgba(0,0,0,0.4)");
						desc.lineWidth  = width - 10;
						desc.lineHeight = 12;
						desc.mask = rect;
						desc.x    = posX + 5;
						desc.y    = posY + 18;
						stage.addChild(desc);
					}
					
					var eop = new createjs.Shape();
					eop.graphics.beginFill('rgba(0,0,0,0.2)').drawRect(posX + width - 1, posY, 1, height);
					stage.addChild(eop);
					
					rect.onPress = function(e) {
						points = [ e.nativeEvent.x || e.nativeEvent.pageX, e.nativeEvent.y || e.nativeEvent.pageY ];
					};
					
					rect.onClick = function(e) {
						var pts = [ e.nativeEvent.x || e.nativeEvent.pageX, e.nativeEvent.y || e.nativeEvent.pageY ];
						
						if ((pts[0] === points[0]) && (pts[1] === points[1]) && e.nativeEvent.isLeftClick()) {
							window.location.hash = '/program?id=' + program.id;
						}
					};
					
					if (param.categories.indexOf(program.category) === -1) {
						rect.alpha  = 0.3;
						title.alpha = 0.3;
						if (desc) desc.alpha = 0.3;
					}
					
					// add to piece
					piece[program.id] = {
						rect : rect,
						title: title,
						desc : desc || null,
						eop  : eop
					};
					
					counter();
				}, 0);
			});
			
			if (channel.programs.length === 0) {
				header.remove();
				return;
			}
			
			++k;
			total += channel.programs.length;
		});
		
		var canvasWidth = (maxlen - param.cur) / 1000 / 1000 * param.unit;
		
		(k).times(function(n) {
			setTimeout(function() {
				var posY   = 5 + n * (5 + param.line);
				
				var b1 = new createjs.Shape();
				b1.graphics.beginFill('rgba(0,0,0,0.21)').drawRect(0, posY, canvasWidth, 1);
				stage.addChild(b1);
				
				var b2 = new createjs.Shape();
				b2.graphics.beginFill('rgba(0,0,0,0.21)').drawRect(0, posY + param.line - 1, canvasWidth, 1);
				stage.addChild(b2);
				
				var b3 = new createjs.Shape();
				b3.graphics.beginFill('#f4f4f4').drawRect(0, posY + param.line, canvasWidth, 1);
				stage.addChild(b3);
			}, 0);
		});
		
		canvas.setAttribute('width', canvasWidth);
		canvas.setAttribute('height', k * (5 + param.line));
		
		// 目盛と日付
		
		param.dateIndex = [];
		param.dateBtns  = [];
		var ld  = -1;
		var lm  = -1;
		var day = [
			'<span class="sun">日</span>',
			'<span>月</span>',
			'<span>火</span>',
			'<span>水</span>',
			'<span>木</span>',
			'<span>金</span>',
			'<span class="sat">土</span>'
		];
		for (var i = param.cur; maxlen > i; i += 60000) {
			var date = new Date(i);
			var d    = date.getDate();
			var m    = date.getMinutes();
			
			if (ld !== d) {
				ld = d;
				
				(function(i, date) {
					var position = (i - param.cur) / 1000 / 1000 * param.unit;
					
					
					var btn = new Element('a').insert(
						date.getDate() + '日' + day[date.getDay()]
					).observe('click', function() {
						contentBodyTimeline.scrollLeft  = position;
						contentBodyTimescale.scrollLeft = position;
						
						param.dateBtns.each(function(a) {
							a.removeClassName('selected');
						});
						
						this.addClassName('selected');
					});
					contentBodyHead.insert(btn);
					
					param.dateIndex.push(position);
					param.dateBtns.push(btn);
				})(i, date);
			}
			
			if ((m === 0) && (lm !== m)) {
				lm = m;
				
				contentBodyTimescale.insert(
					new Element('div', { className: 'timescale-long' }).setStyle({
						left: ((i - param.cur) / 1000 / 1000 * param.unit) + 'px'
					}).insert(date.getHours().toPaddedString(2))
				);
			}
			
			if ((m === 30) && (lm !== m)) {
				lm = m;
				
				contentBodyTimescale.insert(
					new Element('div', { className: 'timescale-middle' }).setStyle({
						left: ((i - param.cur) / 1000 / 1000 * param.unit) + 'px'
					})
				);
			}
			
			if (((m === 10) || (m === 20) || (m === 40) || (m === 50)) && (lm !== m)) {
				lm = m;
				
				contentBodyTimescale.insert(
					new Element('div', { className: 'timescale-short' }).setStyle({
						left: ((i - param.cur) / 1000 / 1000 * param.unit) + 'px'
					})
				);
			}
		}
		
		contentBodyHead.insert(viewConfigBtn.observe('click', viewConfigBtnOnClick));
		contentBodyTimescale.insert(pointer);
	}
	viewSchedule();
	document.observe('chinachu:schedule', viewSchedule);
	
	// 日付の選択状態
	
	function viewScheduleDatePolling() {
		var scrollLeft = contentBodyTimeline.scrollLeft;
		
		setTimeout(function() {
			for (var i = param.dateIndex.length - 1; i >= 0; i--) {
				param.dateBtns[i].className = '';
			}
			
			for (var i = param.dateIndex.length - 1; i >= 0; i--) {
				param.dateBtns[i].className = '';
				
				if (scrollLeft + 1 >= param.dateIndex[i]) {
					param.dateBtns[i].className = 'selected';
					break;
				}
			}
		}, 0);
	}
	var viewScheduleDatePollingInterval = setInterval(viewScheduleDatePolling, 1000);
	
})();
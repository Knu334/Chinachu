P = Class.create(P, {

	init: function _initPage() {

		this.view.content.className = 'loading';

		this.onNotify = this.refresh.bindAsEventListener(this);
		document.observe('chinachu:status', this.onNotify);

		this.draw();

		return this;
	}
	,
	refresh: function() {

		this.draw();

		return this;
	}
	,
	deinit: function _deinit() {

		document.stopObserving('chinachu:status', this.onNotify);

		return this;
	}
	,
	draw: function _draw() {

		this.view.content.className = '';
		this.view.content.update();

		if (!global.chinachu.status.operator) {
			new sakura.ui.Alert({
				title       : 'ステータス',
				body        : '取得待ち...',
				disableClose: true
			}).render(this.view.content);

			return this;
		}

		if (global.chinachu.status.operator.alive === true) {
			new sakura.ui.Alert({
				title       : 'Operator',
				type        : 'green',
				body        : '動作しています',
				disableClose: true
			}).render(this.view.content);
		} else {
			new sakura.ui.Alert({
				title       : 'Operator',
				type        : 'red',
				body        : '停止しています',
				disableClose: true
			}).render(this.view.content);
		}

		new sakura.ui.Alert({
			title		: 'Munin',
			type		: 'green',
			body		: '<br clear="all" /><div style="float: left;margin: 5px 0px 0px 5px;"><img src="/munin/
Mirakurun_Error-week.png" /></div><div style="float: left;margin: 5px 0px 0px 5px;"><img src="/munin/Mirakurun_Stream-week.png"
/></div><div style="float: left;margin: 5px 0px 0px 5px;"><img src="/munin/Mirakurun_Memory_Usage-week.png" /></div><div style="
float: left;margin: 5px 0px 0px 5px;"><img src="/munin/Mirakurun_Timer_Accuracy-week.png" /></div><div style="float: left;margin
: 5px 0px 0px 5px;"><img src="/munin/Mirakurun_Programs_DB-week.png" /></div><br clear="all" />',
			disableClose: true
		}).render(this.view.content);

		return this;
	}
});

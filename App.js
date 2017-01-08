Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
		this._calcPerliminaryEstimate();
	},
	
	_createTree: function(features) {
		
		Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
			models: ['portfolioitem/epic'],
			autoLoad: true,
			enableHierarchy: true
		}).then({
			success: function(store) {
				this.add({
					xtype: 'rallytreegrid',
					store: store,
					context: this.getContext(),
					enableEditing: true,
					shouldShowRowActionsColumn: true,
					enableBulkEdit: true,
					enableRanking: false,
					columnCfgs: [
						'Name',
						'Owner',
						'Project',
						'PercentDoneByStoryCount',
						'PercentDoneByStoryPlanEstimate',
						'PreliminaryEstimate',
						'PreliminaryEstimateValue',
						//'State',
						{
							text: 'Epic PreliminaryEstimateValue', dataIndex: 'Name',  
							renderer: function(value) {
								var peVal = null;
								Ext.Array.each(features, function(epicitem){
									var name = epicitem.Name;  
									if (name == value)
									{
										peVal = epicitem.PEValue;
									}
                                });
								
								return peVal;
							}
						}
					]
				});
			},
			scope: this
		});
	},
	
	_onStoreBuilt: function(store) {
		
		this.add({
			xtype: 'rallytreegrid',
			store: store,
			context: this.getContext(),
			enableEditing: true,
			shouldShowRowActionsColumn: true,
			enableBulkEdit: true,
			enableRanking: false,
			columnCfgs: [
				'Name',
				'Owner',
				'PreliminaryEstimateValue',
				{
                    text: 'User Stories', dataIndex: 'Name', 
                    renderer: function(value) {
						var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(userstory) + '">' + userstory.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
			]
		});
	},




	
	_calcPerliminaryEstimate: function(){
		Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Epic',
            fetch: ['FormattedID','Name', 'Children', 'PreliminaryEstimateValue'],
            pageSize: 100,
            autoLoad: true,
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        });
	},
	
	_onDataLoaded: function(store, data){
                var features = [];
                var pendingstories = data.length;
                Ext.Array.each(data, function(epic) {
                            var f  = {
                                FormattedID: epic.get('FormattedID'),
                                Name: epic.get('Name'),
                                _ref: epic.get("_ref"),
                                PEValue: epic.get('PreliminaryEstimateValue'),
                                Children: []
                            };
							var recs = [];
                            var stories = epic.getCollection('Children');
                           stories.load({
                                fetch: ['FormattedID', 'Name', 'PreliminaryEstimateValue'],
                                callback: function(records, operation, success){
									var total = 0;
									
                                    Ext.Array.each(records, function(story){
                                        var pe = story.get('PreliminaryEstimateValue');
										total = total + pe;
										
										var rec = {
											FormattedID: story.get('FormattedID'),
											Name: story.get('Name'),
											_ref: story.get("_ref"),
											PEValue: story.get('PreliminaryEstimateValue'),
											Children: []
										};
										recs.push(rec);
                                    }, this);
									
									f.PEValue = total;
									
                                    --pendingstories;
                                    if (pendingstories === 0) {
										this._createTree(features);
                                    }
                                },
                                scope: this
                            });
                            features.push(f);
                }, this);
    },
	
	_createGrid: function(features) {
         this.add({
            xtype: 'rallygrid',
            store: Ext.create('Rally.data.custom.Store', {
                data: features,
                pageSize: 100
            }),

            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Preliminary Estimate Value', dataIndex: 'PEValue'
                },
                {
                    text: 'User Stories', dataIndex: 'UserStories', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(userstory) + '">' + userstory.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
            ]

        });
    }
	
});

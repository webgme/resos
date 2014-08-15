/*globals define, _, WebGMEGlobal*/

define([
    'js/Constants',
    'js/NodePropertyNames',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.DecoratorBase',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'text!../Core/ResosDecorator.html',
    'text!./ScheduleDialog.html',
    '../Core/ResosDecorator.Core',
    '../Core/ResosDecorator.Constants',
    'js/DragDrop/DragConstants',
    'js/DragDrop/DragHelper',
    'js/Controls/ContextMenu',
    '../Lib/codemirror/codemirror',
    '../Lib/codemirror/clike',
    '../Lib/jqgrid/js/i18n/grid.locale-en.js',
    '../Lib/jqgrid/js/jquery.jqGrid.min.js',
    'css!./ResosDecorator.DiagramDesignerWidget',
    'css!../Lib/codemirror/codemirror',
    'css!../Lib/jqgrid/css/ui.jqgrid.css',
    'css!../Lib/jqgrid/css/jquery-ui.theme.min.css'
    ], function (
                                                            CONSTANTS,
                                                          nodePropertyNames,
                                                          DiagramDesignerWidgetDecoratorBase,
                                                          DiagramDesignerWidgetConstants,
                                                          resosDecoratorTemplate,
                                                          scheduleDialogTemplate,
                                                          ResosDecoratorCore,
                                                          ResosDecoratorConstants,
                                                          DragConstants,
                                                          DragHelper,
                                                          ContextMenu,
                                                          CodeMirror
                                                        ) {

    "use strict";

    var ResosDecoratorDiagramDesignerWidget,
        SVG_DIR = "/decorators/ResosDecorator/Icons/",
        EMBEDDED_SVG_IMG_BASE_CLASS ='detailButtonSvg',
        EMBEDDED_SVG_IMG_BASE_HOVER_CLASS ='detailButtonHoverSvg',
        EMBEDDED_SVG_IMG_BASE = $('<img class="'+ EMBEDDED_SVG_IMG_BASE_CLASS + '">'),
        EMBEDDED_SVG_IMG_BASE_HOVER = $('<img class="'+ EMBEDDED_SVG_IMG_BASE_HOVER_CLASS +'">'),
        DECORATOR_ID = "ResosDecoratorDiagramDesignerWidget",
        PORT_CONTAINER_OFFSET_Y = 15,
        ACCEPT_DROPPABLE_CLASS = 'accept-droppable',
        DRAGGABLE_MOUSE = 'DRAGGABLE';



    ResosDecoratorDiagramDesignerWidget = function (options) {
        var opts = _.extend( {}, options);

        DiagramDesignerWidgetDecoratorBase.apply(this, [opts]);
        ResosDecoratorCore.apply(this, [opts]);

        this._initializeVariables({"connectors": true});

        this._selfPatterns = {};

        this.logger.debug("ResosDecoratorDiagramDesignerWidget ctor");
    };

    /************************ INHERITANCE *********************/
    _.extend(ResosDecoratorDiagramDesignerWidget.prototype, DiagramDesignerWidgetDecoratorBase.prototype);
    _.extend(ResosDecoratorDiagramDesignerWidget.prototype, ResosDecoratorCore.prototype);

    /**************** OVERRIDE INHERITED / EXTEND ****************/

    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.DECORATORID = DECORATOR_ID;


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.$DOMBase = $(resosDecoratorTemplate);

    ResosDecoratorDiagramDesignerWidget.prototype._detailDialogUIDOMBase =
        $('<div class="modal fade ' + ResosDecoratorConstants.DETAILDIALOG_CLASS + '" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
            '<h4 class="modal-title" >Modal title</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            '<textarea class="codeEditor">Kukucs</textarea>' +
            '<table class="messageWindow"></table>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '<button type="button" class="btn btn-primary">Save changes</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>');

    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.on_addTo = function () {
        var self = this;

        var gmeId = this._metaInfo.GME_ID;
        var currentNode = this._control._client.getNode(gmeId);
        var currentNodeGuid = currentNode.getGuid();
        var currentMetaId = currentNode.getBaseId();
        var currentMetaNode = this._control._client.getNode(currentMetaId);
        var currentMetaName = currentMetaNode.getAttribute('name');

        var parentId = currentNode.getParentId();
        var parentNode = this._control._client.getNode(parentId);
        var parentMetaId = parentNode.getBaseId();
        var parentMetaNode = this._control._client.getNode(parentMetaId);
        var parentMetaGuid = parentMetaNode.getGuid();

        this._renderContent();

        // Hide detail button
        // TODO: Hide by default.
        this.skinParts.$detailButton.hide();

        // set title editable on double-click
        this.skinParts.$name.on("dblclick.editOnDblClick", null, function (event) {
            if (self.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
                $(this).editInPlace({"class": "",
                    "value": self.name,
                    "onChange": function (oldValue, newValue) {
                        self.__onNodeTitleChanged(oldValue, newValue);
                    }});
            }
            event.stopPropagation();
            event.preventDefault();
        });

        // IDL thing
        // TODO: What about refs?
        if (parentMetaGuid === '6f1c7cfb-0cb8-4faa-8e07-f7e8a069efaa' && currentNode.getAttribute('Definition') !== undefined ) {

            var svgFile = 'DetailButton.svg';
            var svgFileHover = 'DetailButtonHover.svg';

            // get the svg from the server in SYNC mode, may take some time
            var imgElement = EMBEDDED_SVG_IMG_BASE.clone();
            this.skinParts.$detailButton.append(imgElement);
            imgElement.attr('src', SVG_DIR + svgFile);

            imgElement = EMBEDDED_SVG_IMG_BASE_HOVER.clone();
            this.skinParts.$detailButton.append(imgElement);
            imgElement.attr('src', SVG_DIR + svgFileHover);
            imgElement.hide();

            this.skinParts.$detailButton.hover(
                function() {
                    $('img.'+EMBEDDED_SVG_IMG_BASE_CLASS, this).hide();
                    $('img.'+EMBEDDED_SVG_IMG_BASE_HOVER_CLASS,this).show();
                },
                function() {
                    $('img.'+EMBEDDED_SVG_IMG_BASE_CLASS, this).show();
                    $('img.'+EMBEDDED_SVG_IMG_BASE_HOVER_CLASS, this).hide();
            });

            this.skinParts.$detailButton.show();

            this.skinParts.$detailButton.on("click.showDialog", null, function (event) {
                var dialog = $(ResosDecoratorDiagramDesignerWidget.prototype._detailDialogUIDOMBase.clone());
                var codeEditor = $('.codeEditor', dialog)[0];
                var defAttr = currentNode.getAttribute('Definition');
                $(codeEditor).val(defAttr);

                dialog.on('shown.bs.modal', function () {
                    CodeMirror.fromTextArea(codeEditor, {
                        lineNumbers: true,
                        matchBrackets: true,
                        mode: "text/x-csharp"
                    });


                    var messagewindow = $('.messageWindow', dialog);
                    messagewindow.jqGrid({
                        datatype: "local",
                        height: 250,
                        colNames: ['Inv No', 'Date', 'Client', 'Amount', 'Tax', 'Total', 'Notes'],
                        colModel: [
                            {name: 'id', index: 'id', width: 60, sorttype: "int"},
                            {name: 'invdate', index: 'invdate', width: 90, sorttype: "date"},
                            {name: 'name', index: 'name', width: 100},
                            {name: 'amount', index: 'amount', width: 80, align: "right", sorttype: "float"},
                            {name: 'tax', index: 'tax', width: 80, align: "right", sorttype: "float"},
                            {name: 'total', index: 'total', width: 80, align: "right", sorttype: "float"},
                            {name: 'note', index: 'note', width: 150, sortable: false}
                        ],
                        multiselect: true,
                        caption: "Manipulating Array Data"
                    });
                    var mydata = [
                        {id: "1", invdate: "2007-10-01", name: "test", note: "note", amount: "200.00", tax: "10.00", total: "210.00"},
                        {id: "2", invdate: "2007-10-02", name: "test2", note: "note2", amount: "300.00", tax: "20.00", total: "320.00"},
                        {id: "3", invdate: "2007-09-01", name: "test3", note: "note3", amount: "400.00", tax: "30.00", total: "430.00"},
                        {id: "4", invdate: "2007-10-04", name: "test", note: "note", amount: "200.00", tax: "10.00", total: "210.00"},
                        {id: "5", invdate: "2007-10-05", name: "test2", note: "note2", amount: "300.00", tax: "20.00", total: "320.00"},
                        {id: "6", invdate: "2007-09-06", name: "test3", note: "note3", amount: "400.00", tax: "30.00", total: "430.00"},
                        {id: "7", invdate: "2007-10-04", name: "test", note: "note", amount: "200.00", tax: "10.00", total: "210.00"},
                        {id: "8", invdate: "2007-10-03", name: "test2", note: "note2", amount: "300.00", tax: "20.00", total: "320.00"},
                        {id: "9", invdate: "2007-09-01", name: "test3", note: "note3", amount: "400.00", tax: "30.00", total: "430.00"}
                    ];
                    for (var i = 0; i <= mydata.length; i++) {
                        messagewindow.jqGrid('addRowData', i + 1, mydata[i]);
                    }

                    codeEditor.focus();
                });

                dialog.modal('show');

                event.stopPropagation();
                event.preventDefault();
            });
        }
        else if (parentMetaGuid === '9f170e00-1852-44ca-bb17-5929e8763de4' && currentMetaName === 'Schedule')
        {
            var svgFile = 'DetailButton.svg';
            var svgFileHover = 'DetailButtonHover.svg';

            // get the svg from the server in SYNC mode, may take some time
            var imgElement = EMBEDDED_SVG_IMG_BASE.clone();
            this.skinParts.$detailButton.append(imgElement);
            imgElement.attr('src', SVG_DIR + svgFile);

            imgElement = EMBEDDED_SVG_IMG_BASE_HOVER.clone();
            this.skinParts.$detailButton.append(imgElement);
            imgElement.attr('src', SVG_DIR + svgFileHover);
            imgElement.hide();

            this.skinParts.$detailButton.hover(
                function() {
                    $('img.'+EMBEDDED_SVG_IMG_BASE_CLASS, this).hide();
                    $('img.'+EMBEDDED_SVG_IMG_BASE_HOVER_CLASS,this).show();
                },
                function() {
                    $('img.'+EMBEDDED_SVG_IMG_BASE_CLASS, this).show();
                    $('img.'+EMBEDDED_SVG_IMG_BASE_HOVER_CLASS, this).hide();
                });

            this.skinParts.$detailButton.show();

            var dialog = $(scheduleDialogTemplate).modal({
                show:false
            });

            var partitionPortIds = currentNode.getChildrenIds();
            var partitionList = '';
            for (var i = 0; i < partitionPortIds.length; i++) {
                var childId = partitionPortIds[i];
                var childNode = self._control._client.getNode(childId);
                var childNodeName = childNode.getAttribute('name');
                var childNodeDuration = childNode.getAttribute('Duration');
                var childNodePeriod = childNode.getAttribute('Period');
                var currentNodeOffset = currentNode.getAttribute('NodeSchedule');

                partitionList = partitionList.concat('PP',i,':',childNodeName,';');
                //tableOne.jqGrid('addRowData', i + 1, {id:i, partitionName:childNodeName, offset:currentNodeOffset});
            }

            var prmDel={
                onclickSubmit: function (options, rowid) {
                    var $this = $(this),
                        grid_id = $.jgrid.jqID(this.id),
                        grid_p = this.p,
                        newPage = grid_p.page;

                    // reset the value of processing option to true to
                    // skip the ajax request to 'clientArray'.
                    options.processing = true;

                    // delete the row
                    if (grid_p.treeGrid) {
                        $this.jqGrid("delTreeNode", rowid);
                    } else {
                        $this.jqGrid("delRowData", rowid);
                    }
                    $.jgrid.hideModal("#delmod" + grid_id, {
                        gb: "#gbox_" + grid_id,
                        jqm: options.jqModal,
                        onClose: options.onClose
                    });

                    if (grid_p.lastpage > 1) {// on the multipage grid reload the grid
                        if (grid_p.reccount === 0 && newPage === grid_p.lastpage) {
                            // if after deliting there are no rows on the current page
                            // which is the last page of the grid
                            newPage--; // go to the previous page
                        }
                        // reload grid to make the row from the next page visable.
                        $this.trigger("reloadGrid", [{page: newPage}]);
                    }

                    return true;
                },
                processing: true
            };
            var prmSearch={};
            var prmView={};
            var prmEdit ={};
            var prmAdd={};

            dialog.on('shown.bs.modal', function () {
                var tableWrapper = $('div.tableWrapperOne', dialog);
                tableWrapper.empty();
                tableWrapper.append('<table id="tableOne"></table><div id="gridpager"></div>');

                var tableOne = $('#tableOne', tableWrapper);

                tableOne.jqGrid({
                    datatype: 'local',//'clientSide',
                    editurl:'clientArray',
                    colNames: ['Id','Partition name', 'Offset'],
                    colModel: [
                        {name: 'id', index: 'id', width: 40},
                        {name: 'partitionName', index: 'partitionName', width: 280,editable:true, edittype:"select",editoptions:{value:partitionList}},
                        {name: 'offset', index: 'offset', width: 80, sorttype: "int",editable:true},
                    ],
                    multiselect: false,
                    caption: "Partition",
                    //cellEdit: true,
                    //cellsubmit: 'clientArray',
                    pager : '#gridpager',
                    emptyrecords: "Nothing to display"
                });

                tableOne.jqGrid('navGrid','#gridpager',
                    { view:false, del:true, add:false, refresh:false, search:false, edit:false},
                    prmEdit,
                    prmAdd,
                    prmDel,
                    prmSearch,
                    prmView);
                tableOne.jqGrid('inlineNav', '#gridpager', {addParams: {position: "last"}});

                var nodeScheduleJson = currentNode.getAttribute('NodeSchedule');
                if (nodeScheduleJson==='' ||nodeScheduleJson===undefined || nodeScheduleJson===null){
                    nodeScheduleJson='[]';
                }

                var nodeSchedule = $.parseJSON(nodeScheduleJson);

                if (nodeSchedule === undefined || nodeSchedule === null || nodeSchedule === -1){
                    nodeSchedule = [];
                }

                for (var i = 0; i < nodeSchedule.length; i++) {
                    tableOne.jqGrid('addRowData', i + 1, nodeSchedule[i]);
                }
            });

            dialog.on('hide.bs.modal', function (e) {
                var tableWrapper = $('div.tableWrapperOne', dialog);
                var tableOne = $('#tableOne', tableWrapper);
                var dataFromGrid = tableOne.jqGrid('getGridParam','data');
                var jsonData = JSON.stringify(dataFromGrid);
                self._control._client.setAttributes(gmeId, 'NodeSchedule', jsonData);
                $('div.tableWrapperOne', dialog).empty();
            });

            this.skinParts.$detailButton.on("click.showDialog", null, function (event) {
                dialog.modal('show');

                event.stopPropagation();
                event.preventDefault();
            });
        }

        // reference icon on double-click
        this.$el.on("dblclick.ptrDblClick", '.' + ResosDecoratorConstants.POINTER_CLASS, function (event) {
            if (!($(this).hasClass(ResosDecoratorConstants.POINTER_CLASS_NON_SET))) {
                self.__onPointerDblClick({'x': event.clientX, 'y': event.clientY});
            }
            event.stopPropagation();
            event.preventDefault();
        });
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.update = function () {
        this._update();

        // Todo: here comes the background settings
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.onRenderGetLayoutInfo = function () {
        this._paddingTop = parseInt(this.$el.css('padding-top'), 10);
        this._borderTop = parseInt(this.$el.css('border-top-width'), 10);

        DiagramDesignerWidgetDecoratorBase.prototype.onRenderGetLayoutInfo.call(this);
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.destroy = function () {
        //drop territory
        if (this._territoryId) {
            this._control._client.removeUI(this._territoryId);
        }

        //call base destroy
        ResosDecoratorCore.prototype.destroy.call(this);
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.getConnectionAreas = function (id/*, isEnd, connectionMetaInfo*/) {
        var result = [],
            edge = 10,
            LEN = 20;

        //by default return the bounding box edges midpoints

        if (id === undefined || id === this.hostDesignerItem.id) {
            //North side
            result.push( {"id": "N",
                "x1": edge,
                "y1": 0,
                "x2": this.hostDesignerItem.getWidth() - edge,
                "y2": 0,
                "angle1": 270,
                "angle2": 270,
                "len": LEN} );

            //South side
            result.push( {"id": "S",
                "x1": edge,
                "y1": this.hostDesignerItem.getHeight(),
                "x2": this.hostDesignerItem.getWidth() - edge,
                "y2": this.hostDesignerItem.getHeight(),
                "angle1": 90,
                "angle2": 90,
                "len": LEN} );

            //check east and west
            //if there is port on the side, it's disabled for drawing connections
            //otherwise enabled
            var eastEnabled = true;
            var westEnabled = true;
            for (var pId in this.ports) {
                if (this.ports.hasOwnProperty(pId)) {
                    if (this.ports[pId].orientation === "E") {
                        eastEnabled = false;
                    }
                    if (this.ports[pId].orientation === "W") {
                        westEnabled = false;
                    }
                }
                if (!eastEnabled && !westEnabled) {
                    break;
                }
            }

            if (eastEnabled) {
                result.push({"id": "E",
                    "x1": this.hostDesignerItem.getWidth(),
                    "y1": edge,
                    "x2": this.hostDesignerItem.getWidth(),
                    "y2": this.hostDesignerItem.getHeight() - edge,
                    "angle1": 0,
                    "angle2": 0,
                    "len": LEN});
            }

            if (westEnabled) {
                result.push({"id": "W",
                    "x1": 0,
                    "y1": edge,
                    "x2": 0,
                    "y2": this.hostDesignerItem.getHeight() - edge,
                    "angle1": 180,
                    "angle2": 180,
                    "len": LEN});
            }

        } else if (this.ports[id]) {
            //subcomponent
            var portConnArea = this.ports[id].getConnectorArea(),
                idx = this.portIDs.indexOf(id);

            result.push( {"id": idx,
                "x1": portConnArea.x1,
                "y1": portConnArea.y1 + PORT_CONTAINER_OFFSET_Y + this._paddingTop + this._borderTop,
                "x2": portConnArea.x2,
                "y2": portConnArea.y2 + PORT_CONTAINER_OFFSET_Y + this._paddingTop + this._borderTop,
                "angle1": portConnArea.angle1,
                "angle2": portConnArea.angle2,
                "len": portConnArea.len} );
        }

        return result;
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    //called when the designer item's subcomponent should be updated
    ResosDecoratorDiagramDesignerWidget.prototype.updateSubcomponent = function (portId) {
        this._updatePort(portId);
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    //Shows the 'connectors' - appends them to the DOM
    ResosDecoratorDiagramDesignerWidget.prototype.showSourceConnectors = function (params) {
        var connectors,
            i;

        if (!params) {
            this.$sourceConnectors.show();
            if (this.portIDs) {
                i = this.portIDs.length;
                while (i--) {
                    this.ports[this.portIDs[i]].showConnectors();
                }
            }
        } else {
            connectors = params.connectors;
            i = connectors.length;
            while (i--) {
                if (connectors[i] === undefined) {
                    //show connector for the represented item itself
                    this.$sourceConnectors.show();
                } else {
                    //one of the ports' connector should be displayed
                    if (this.ports[connectors[i]]) {
                        this.ports[connectors[i]].showConnectors();
                    }
                }
            }
        }
    };

    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    //Hides the 'connectors' - detaches them from the DOM
    ResosDecoratorDiagramDesignerWidget.prototype.hideSourceConnectors = function () {
        var i;

        this.$sourceConnectors.hide();

        if (this.portIDs) {
            i = this.portIDs.length;
            while (i--) {
                this.ports[this.portIDs[i]].hideConnectors();
            }
        }
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    //should highlight the connectors for the given elements
    ResosDecoratorDiagramDesignerWidget.prototype.showEndConnectors = function (params) {
       this.showSourceConnectors(params);
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    //Hides the 'connectors' - detaches them from the DOM
    ResosDecoratorDiagramDesignerWidget.prototype.hideEndConnectors = function () {
        this.hideSourceConnectors();
    };


    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    ResosDecoratorDiagramDesignerWidget.prototype.notifyComponentEvent = function (componentList) {
        var len = componentList.length;
        while (len--) {
            this._updatePort(componentList[len].id);
        }
        this._checkTerritoryReady();
    };


    /**** Override from ResosDecoratorCore ****/
    ResosDecoratorDiagramDesignerWidget.prototype._portPositionChanged = function (portId) {
        this.onRenderGetLayoutInfo();
        console.log('port position changed');
        this.hostDesignerItem.canvas.dispatchEvent(this.hostDesignerItem.canvas.events.ITEM_SUBCOMPONENT_POSITION_CHANGED, {
                "ItemID": this.hostDesignerItem.id,
                "SubComponentID": portId
            });
    };


    /**** Override from ResosDecoratorCore ****/
    ResosDecoratorDiagramDesignerWidget.prototype.renderPort = function (portId) {
        this.__registerAsSubcomponent(portId);

        return ResosDecoratorCore.prototype.renderPort.call(this, portId);
    };


    /**** Override from ResosDecoratorCore ****/
    ResosDecoratorDiagramDesignerWidget.prototype.removePort = function (portId) {
        var idx = this.portIDs.indexOf(portId);

        if (idx !== -1) {
            this.__unregisterAsSubcomponent(portId);
        }

        ResosDecoratorCore.prototype.removePort.call(this, portId);
    };


    /**** Override from ResosDecoratorCore ****/
    ResosDecoratorDiagramDesignerWidget.prototype._updatePointers = function () {
        var inverseClass = 'inverse-on-hover',
            self = this;

        ResosDecoratorCore.prototype._updatePointers.call(this);

        if (this.skinParts.$ptr) {
            if (this.skinParts.$ptr.hasClass(ResosDecoratorConstants.POINTER_CLASS_NON_SET)) {
                this.skinParts.$ptr.removeClass(inverseClass);
            } else {
                this.skinParts.$ptr.addClass(inverseClass);
            }

            //edit droppable mode
            this.$el.on('mouseenter.' + DRAGGABLE_MOUSE, null, function (event) {
                self.__onMouseEnter(event);
            })
            .on('mouseleave.' + DRAGGABLE_MOUSE, null, function (event) {
                self.__onMouseLeave(event);
            })
            .on('mouseup.' + DRAGGABLE_MOUSE, null, function (event) {
                self.__onMouseUp(event);
            });
        } else {
            this.$el.off('mouseenter.' + DRAGGABLE_MOUSE)
                .off('mouseleave.' + DRAGGABLE_MOUSE)
                .off('mouseup.' + DRAGGABLE_MOUSE);
        }

        this._setPointerTerritory(this._getPointerTargets());
    };


    /**** Override from ResosDecoratorCore ****/
    ResosDecoratorDiagramDesignerWidget.prototype._setPointerTerritory = function (pointerTargets) {
        var logger = this.logger,
            len = pointerTargets.length;

        this._selfPatterns = {};

        if (len > 0) {
            if (!this._territoryId) {
                this._territoryId = this._control._client.addUI(this, function (events) {
                    //don't really care here, just want to make sure that the reference object is loaded in the client
                    logger.debug('onEvent: ' + JSON.stringify(events));
                });
            }
            while (len--) {
                this._selfPatterns[pointerTargets[len][1]] = { "children": 0 };
            }
        }

        if (this._selfPatterns && !_.isEmpty(this._selfPatterns)) {
            this._control._client.updateTerritory(this._territoryId, this._selfPatterns);
        } else {
            if (this._territoryId) {
                this._control._client.removeUI(this._territoryId);
            }
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onBackgroundDroppableOver = function (helper) {
        if (this.__onBackgroundDroppableAccept(helper) === true) {
            this.__doAcceptDroppable(true);
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onBackgroundDroppableOut = function () {
        this.__doAcceptDroppable(false);
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onBackgroundDrop = function (helper) {
        var dragInfo = helper.data(DragConstants.DRAG_INFO),
            dragItems = DragHelper.getDragItems(dragInfo),
            dragEffects = DragHelper.getDragEffects(dragInfo);

        if (this.__acceptDroppable === true) {
            if (dragItems.length === 1 && dragEffects.indexOf(DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER) !== -1) {
                this._setPointerTarget(dragItems[0], helper.offset());
            }
        }

        this.__doAcceptDroppable(false);
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onBackgroundDroppableAccept = function (helper) {
        var dragInfo = helper.data(DragConstants.DRAG_INFO),
            dragItems = DragHelper.getDragItems(dragInfo),
            dragEffects = DragHelper.getDragEffects(dragInfo),
            doAccept = false;

        //check if there is only one item being dragged, it is not self,
        //and that element can be a valid target of at least one pointer of this guy
        if (dragItems.length === 1 &&
            dragItems[0] !== this._metaInfo[CONSTANTS.GME_ID] &&
            dragEffects.indexOf(DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER) !== -1) {
            doAccept = this._getValidPointersForTarget(dragItems[0]).length > 0;
        }

        return doAccept;
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__doAcceptDroppable = function (accept) {
        if (accept === true) {
            this.__acceptDroppable = true;
            this.$el.addClass(ACCEPT_DROPPABLE_CLASS);
        } else {
            this.__acceptDroppable = false;
            this.$el.removeClass(ACCEPT_DROPPABLE_CLASS);
        }

        this.hostDesignerItem.canvas._enableDroppable(!accept);
    };


    ResosDecoratorDiagramDesignerWidget.prototype.__onMouseEnter = function (event) {
        if (this.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
            //check if it's dragging anything with jQueryUI
            if ($.ui.ddmanager.current && $.ui.ddmanager.current.helper) {
                this.__onDragOver = true;
                this.__onBackgroundDroppableOver($.ui.ddmanager.current.helper);
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onMouseLeave = function (event) {
        if (this.__onDragOver) {
            this.__onBackgroundDroppableOut();
            this.__onDragOver = false;
            event.stopPropagation();
            event.preventDefault();
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__onMouseUp = function (/*event*/) {
        if (this.__onDragOver) {
            //TODO: this is still questionable if we should hack the jQeuryUI 's draggable&droppable and use half of it only
            this.__onBackgroundDrop($.ui.ddmanager.current.helper);
            this.__onDragOver = false;
            this.hostDesignerItem.canvas._enableDroppable(false);
        }
    };


    ResosDecoratorDiagramDesignerWidget.prototype.__registerAsSubcomponent = function(portId) {
        if (this.hostDesignerItem) {
            this.hostDesignerItem.registerSubcomponent(portId, {"GME_ID": portId});
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype.__unregisterAsSubcomponent = function(portId) {
        if (this.hostDesignerItem) {
            this.hostDesignerItem.unregisterSubcomponent(portId);
        }
    };


    ResosDecoratorDiagramDesignerWidget.prototype.__onNodeTitleChanged = function (oldValue, newValue) {
        var client = this._control._client;

        client.setAttributes(this._metaInfo[CONSTANTS.GME_ID], nodePropertyNames.Attributes.name, newValue);
    };


    ResosDecoratorDiagramDesignerWidget.prototype.__onPointerDblClick = function (mousePos) {
        var pointerTargets = this._getPointerTargets(),
            menu,
            self = this,
            menuItems = {},
            i,
            ptrTargets = {};

        if (pointerTargets.length > 0) {
            if (pointerTargets.length === 1) {
                this._navigateToPointerTarget(pointerTargets[0][1]);
            } else {
                for (i = 0; i < pointerTargets.length; i += 1) {
                    menuItems[pointerTargets[i][0]] = {
                        "name": "Follow pointer '" + pointerTargets[i][0] + "'"
                    };
                    ptrTargets[pointerTargets[i][0]] = pointerTargets[i][1];
                }

                menu = new ContextMenu({'items': menuItems,
                    'callback': function (key) {
                        self._navigateToPointerTarget(ptrTargets[key]);
                    }});

                menu.show(mousePos);
            }
        }
    };

    ResosDecoratorDiagramDesignerWidget.prototype._navigateToPointerTarget = function (targetID) {
        var client = this._control._client,
            targetNodeObj;

        targetNodeObj = client.getNode(targetID);
        if (targetNodeObj) {
            if (targetNodeObj.getParentId() || targetNodeObj.getParentId() === CONSTANTS.PROJECT_ROOT_ID) {
                WebGMEGlobal.State.registerActiveObject(targetNodeObj.getParentId());
                WebGMEGlobal.State.registerActiveSelection([targetID]);
            } else {
                WebGMEGlobal.State.registerActiveObject(CONSTANTS.PROJECT_ROOT_ID);
                WebGMEGlobal.State.registerActiveSelection([targetID]);
            }
        }
    };


    return ResosDecoratorDiagramDesignerWidget;
});
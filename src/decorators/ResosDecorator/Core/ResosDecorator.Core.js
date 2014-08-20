/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * 
 * Author: Robert Kereskenyi
 */

define([
    'angular',
    'js/Constants',
    'js/NodePropertyNames',
    'js/RegistryKeys',
    'loaderProgressBar',
    './Port',
    './ResosDecorator.Constants',
    'js/Decorators/DecoratorWithPorts.Base',
    'js/Utils/DisplayFormat',
    'js/Utils/GMEConcepts',
    'js/Controls/ContextMenu'], function (ng,
                         CONSTANTS,
                         nodePropertyNames,
                         REGISTRY_KEYS,
                         LoaderProgressBar,
                         Port,
                         ResosDecoratorConstants,
                         DecoratorWithPortsBase,
                         displayFormat,
                         GMEConcepts,
                         ContextMenu) {

        "use strict";

        var ResosDecoratorCore,
        ABSTRACT_CLASS = 'abstract',
        // SVG_DIR = CONSTANTS.ASSETS_DECORATOR_SVG_FOLDER,
            SVG_DIR = "/decorators/ResosDecorator/Icons/",
            //SVG_ICON_PATH = "/decorators/LogicGatesDecorator/Icons/",
        EMBEDDED_SVG_CLASS = 'embeddedsvg',
        CONNECTION_TYPE_CLASS = 'conn-type',
        EXCLUDED_POINTERS = [CONSTANTS.POINTER_BASE, CONSTANTS.POINTER_SOURCE, CONSTANTS.POINTER_TARGET],
        CONN_TYPE_BASE = $('<div/>', {class: CONNECTION_TYPE_CLASS }),
        EMBEDDED_SVG_IMG_BASE = $('<img>', {'class': EMBEDDED_SVG_CLASS});


        ResosDecoratorCore = function (params) {
            DecoratorWithPortsBase.apply(this, []);

            if (params && params.aspect) {
                this._aspect = params.aspect;
            }
        };

        _.extend(ResosDecoratorCore.prototype, DecoratorWithPortsBase.prototype);

        ResosDecoratorCore.prototype._initializeVariables = function (params) {
        this.name = "";
        this.formattedName = "";
        this.portIDs = [];
        this.ports = {};
        this.skinParts = { "$name": undefined,
            "$portsContainer": undefined,
            "$portsContainerLeft": undefined,
            "$portsContainerRight": undefined,
            "$portsContainerCenter": undefined,
            "$ptr": undefined,
            "$detailButton":undefined,
            "$detailDialog":undefined,
            "$imgSVG": undefined};
		
		this._displayConnectors = false;			
		if (params && params.connectors) {
			this._displayConnectors = params.connectors;			
		}
    };

    /**** Override from *.WidgetDecoratorBase ****/
        ResosDecoratorCore.prototype.destroy = function () {
        var len = this.portIDs.length;
        while (len--) {
            this.unregisterPortIdForNotification(this.portIDs[len]);
            this.removePort(this.portIDs[len]);
        }
    };


    /**** Override from *.WidgetDecoratorBase ****/
        ResosDecoratorCore.prototype.doSearch = function (searchDesc) {
        var searchText = searchDesc.toString().toLowerCase();

        return (this.formattedName && this.formattedName.toLowerCase().indexOf(searchText) !== -1);
    };

        ResosDecoratorCore.prototype._renderContent = function () {
        //render GME-ID in the DOM, for debugging
        this.$el.attr({"data-id": this._metaInfo[CONSTANTS.GME_ID]});

        /* BUILD UI*/
        //find placeholders
        this.skinParts.$name = this.$el.find(".name");
        this.skinParts.$portsContainer = this.$el.find(".ports");
        this.skinParts.$portsContainerLeft = this.skinParts.$portsContainer.find(".left");
        this.skinParts.$portsContainerRight = this.skinParts.$portsContainer.find(".right");
        this.skinParts.$portsContainerCenter = this.skinParts.$portsContainer.find(".center");
		this.skinParts.$detailButton = this.$el.find(".detailButton");
        this.skinParts.$detailDialog = this.$el.find(".detailDialog");

		this._update();
    };
	
        ResosDecoratorCore.prototype._update = function () {
        this._updateColors();
        this._updateName();
        this._updatePorts();
        this._updatePointers();
        this._updateAbstract();
        this._updateSVG();
        this._updateConnectionType();
    };

        ResosDecoratorCore.prototype._updateColors = function () {
        this._getNodeColorsFromRegistry();

        /*if (this.fillColor) {
            this.$el.css({'background-color': this.fillColor});
        } else {
            this.$el.css({'background-color': ''});
        }*/

        if (this.borderColor) {
            this.$el.css({'border-color': this.borderColor,
                          'box-shadow': '0px 0px 7px 0px ' + this.borderColor + ' inset'});
            this.skinParts.$name.css({'border-color': this.borderColor});
        } else {
            this.$el.css({'border-color': '',
                'box-shadow': ''});
            this.skinParts.$name.css({'border-color': ''});
        }

        /*if (this.textColor) {
            this.$el.css({'color': this.textColor});
        } else {
            this.$el.css({'color': ''});
        }*/
    };

        ResosDecoratorCore.prototype._getNodeColorsFromRegistry = function () {
        var objID = this._metaInfo[CONSTANTS.GME_ID];
        this.fillColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.COLOR, true);
        this.borderColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.BORDER_COLOR, true);
        //this.textColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.TEXT_COLOR, true);
    };

    /***** UPDATE THE NAME OF THE NODE *****/
        ResosDecoratorCore.prototype._updateName = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            noName = "(N/A)";

        if (nodeObj) {
            this.name = nodeObj.getAttribute(nodePropertyNames.Attributes.name);
            this.formattedName = displayFormat.resolve(nodeObj);
        } else {
            this.name = "";
            this.formattedName = noName;
        }

        this.skinParts.$name.text(this.formattedName);
        this.skinParts.$name.attr("title", this.formattedName);
    };

        ResosDecoratorCore.prototype._updateConnectionType = function () {
        var isConnectionType = GMEConcepts.isConnectionType(this._metaInfo[CONSTANTS.GME_ID]);

        this.skinParts.$name.text(this.formattedName);
        this.skinParts.$name.attr("title", this.formattedName);
        if (isConnectionType) {
            if (!this.skinParts.$divConnType) {
                this.skinParts.$divConnType = CONN_TYPE_BASE.clone();
                this.skinParts.$divConnType.insertAfter(this.skinParts.$name);
                this.skinParts.$divConnType.text('<< Connection >>');
            }
        } else {
            if (this.skinParts.$divConnType) {
                this.skinParts.$divConnType.remove();
                delete this.skinParts.$divConnType;
            }
        }
    };

    ResosDecoratorCore.prototype.getPortIDs = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            childrenIDs = [],
            len,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            hasAspect = this._aspect && this._aspect !== CONSTANTS.ASPECT_ALL && client.getMetaAspectNames(gmeID).indexOf(this._aspect) !== -1;

        if (nodeObj) {
            var currentNodeGuid = nodeObj.getGuid();
            var currentMetaId = nodeObj.getBaseId();
            var currentMetaNode = client.getNode(currentMetaId);
            var currentMetaName = currentMetaNode.getAttribute('name');

            var parentId = nodeObj.getParentId();
            var parentNode = client.getNode(parentId);
            var parentMetaId = parentNode.getBaseId();
            var parentMetaNode = client.getNode(parentMetaId);
            var parentMetaGuid = parentMetaNode.getGuid();

            if (parentMetaGuid === '9f170e00-1852-44ca-bb17-5929e8763de4' && currentMetaName === 'ClusterConfigurationsRef'){
                // 1: Get the referred configuration
                var referTo = nodeObj.getPointer('referTo');
                if (referTo!==undefined && referTo!==null && referTo.to!==null && referTo.to!==undefined && referTo!==''){
                    var toId = referTo.to;
                    nodeObj = client.getNode(toId);
                }
				
				// 2: Get the allowedPorts (show ports which are members of the configuration set)
                var parentChildrenIds = parentNode.getChildrenIds().slice(0);
                for (var i = 0; i<parentChildrenIds.length; i++){
                    var childrenNode = client.getNode(parentChildrenIds[i]);
                    var childrenMetaId = childrenNode.getBaseId();
                    var childrenMetaNode = client.getNode(childrenMetaId);
                    var childrenMetaName = childrenMetaNode.getAttribute('name');
                    if (childrenMetaName!=='ClusterConfigurationRef') {
                        continue;
                    }
                    else{
                        var referredConfiguration = childrenNode.getPointer('referTo');
                        if (referredConfiguration!==undefined && referredConfiguration!==null && referredConfiguration.to!==null && referredConfiguration.to!==undefined && referredConfiguration!==''){
                            var configurationId = referredConfiguration.to;
                            var configurationNode = client.getNode(configurationId);
                            if (configurationNode===null){
                                continue;
                            }
                            var setNames = configurationNode.getSetNames();
                            if (setNames===null || setNames.length<1) {
                                continue;
                            }
                            var setName = setNames[0];
                            var memberIds = configurationNode.getMemberIds(setName);
                            if (memberIds!==null && memberIds.length>0) {
                                childrenIDs = nodeObj.getChildrenIds().slice(0);
                                //filter out the ones that are not part of the specified aspect
                                len = childrenIDs.length;
                                while (len--) {
                                    if (hasAspect && !GMEConcepts.isValidTypeInAspect(childrenIDs[len], gmeID, this._aspect)) {
                                        childrenIDs.splice(len, 1);
                                    }

                                    // if the port is not in the configuration set -> do not show
                                    else if (memberIds.indexOf(childrenIDs[len]) === -1) {
                                        childrenIDs.splice(len, 1);
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            }
            else {
                childrenIDs = nodeObj.getChildrenIds().slice(0);

                //filter out the ones that are not part of the specified aspect
                if (hasAspect) {
                    len = childrenIDs.length;
                    while (len--) {
                        if (!GMEConcepts.isValidTypeInAspect(childrenIDs[len], gmeID, this._aspect)) {
                            childrenIDs.splice(len, 1);
                        }
                    }
                }
            }
        }

        return childrenIDs;
    };


    /***** UPDATE THE PORTS OF THE NODE *****/
        ResosDecoratorCore.prototype._updatePorts = function () {
        this.updatePortIDList();

        this._checkTerritoryReady();
    };

        ResosDecoratorCore.prototype.renderPort = function (portId) {
        var client = this._control._client,
            portNode = client.getNode(portId),
            portTitle = displayFormat.resolve(portNode),
            portInstance = new Port(portId, { "title": portTitle,
                "decorator": this,
                "svg": portNode.getRegistry(REGISTRY_KEYS.PORT_SVG_ICON)});

        this._addPortToContainer(portNode, portInstance);

        return portInstance;
    };


        ResosDecoratorCore.prototype._addPortToContainer = function (portNode, portInstance) {
        var portId = portNode.getId(),
            portOrientation = "W",
            portContainer = this.skinParts.$portsContainerLeft,
            portPosition = portNode.getRegistry(REGISTRY_KEYS.POSITION) || { "x": 0, "y": 0 },
            portToAppendBefore = null,
            i,
            changed;

        //check if the port should be on the left or right-side
        if (portPosition.x > 300) {
            portOrientation = "E";
            portContainer = this.skinParts.$portsContainerRight;
        }

        changed = portInstance.updateOrPos(portOrientation, portPosition);

        //find its correct position
        for (i in this.ports) {
            if (this.ports.hasOwnProperty(i)) {
                if (i !== portId) {
                    if (this.ports[i].orientation === portInstance.orientation) {
                        if ((portInstance.position.y < this.ports[i].position.y) ||
                            ((portInstance.position.y === this.ports[i].position.y) && (portInstance.title < this.ports[i].title))) {
                            if (portToAppendBefore === null) {
                                portToAppendBefore = i;
                            } else {
                                if ((this.ports[i].position.y < this.ports[portToAppendBefore].position.y) ||
                                    ((this.ports[i].position.y === this.ports[portToAppendBefore].position.y) && (this.ports[i].title < this.ports[portToAppendBefore].title))) {
                                    portToAppendBefore = i;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (portToAppendBefore === null) {
            portContainer.append(portInstance.$el);
        } else {
            portInstance.$el.insertBefore(this.ports[portToAppendBefore].$el);
        }

        if (changed === true) {
            this._portPositionChanged(portId);
        }
    };


        ResosDecoratorCore.prototype._portPositionChanged = function (portId) {
    };


        ResosDecoratorCore.prototype._updatePort = function (portId) {
        var idx = this.portIDs.indexOf(portId),
            client = this._control._client,
            portNode = client.getNode(portId),
            isPort = this.isPort(portId),
            portTitle;

        //check if it is already displayed as port
        if (idx !== -1) {
            //port already, should it stay one?
            if (isPort === true) {
                portTitle = displayFormat.resolve(portNode);
                this.ports[portId].update({"title": portTitle,
                    "svg": portNode.getRegistry(REGISTRY_KEYS.PORT_SVG_ICON)});
                this._updatePortPosition(portId);
            } else {
                this.removePort(portId);
            }
        } else {
            this.addPort(portId);
        }
    };


    ResosDecoratorCore.prototype._updatePortPosition = function (portId) {
        var portNode = this._control._client.getNode(portId),
            portPosition = portNode.getRegistry(REGISTRY_KEYS.POSITION) || { "x": 0, "y": 0 };

        //check if is has changed at all
        if ((this.ports[portId].position.x !== portPosition.x) ||
            (this.ports[portId].position.y !== portPosition.y)) {

            //detach from DOM
            this.ports[portId].$el.detach();

            //reattach
            this._addPortToContainer(portNode, this.ports[portId]);
        }
    };


    ResosDecoratorCore.prototype._checkTerritoryReady = function () {
        //the territory rule here is all children
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            tReady = true,
            childrenIDs,
            len;

        //TODO: hard to tell with the aspect info involved
        if (this._aspect === CONSTANTS.ASPECT_ALL) {
            if (nodeObj) {
                childrenIDs = nodeObj.getChildrenIds();
                len = childrenIDs.length;
                while (len--) {
                    nodeObj = client.getNode(childrenIDs[len]);
                    if (!nodeObj) {
                        tReady = false;
                        break;
                    }
                }
            } else {
                tReady = false;
            }
        }

        if (tReady === true) {
            this._hidePortProgressBar();
        } else {
            this._showPortProgressBar();
        }
    };


    ResosDecoratorCore.prototype._showPortProgressBar = function () {
        var pgBar = this.$el.find('.' + ResosDecoratorConstants.PROGRESS_BAR_CLASS);
        if (pgBar.length === 0) {
            pgBar = $('<div/>', {'class': ResosDecoratorConstants.PROGRESS_BAR_CLASS});
            this.$el.append(pgBar);

            this._loader = new LoaderProgressBar({"containerElement": pgBar});
            this._loader.start();
        }
    };


    ResosDecoratorCore.prototype._hidePortProgressBar = function () {
        if (this._loader) {
            this._loader.stop();
            this._loader.destroy();
            delete this._loader;
        }

        this.$el.find('.' + ResosDecoratorConstants.PROGRESS_BAR_CLASS).remove();
    };


    ResosDecoratorCore.prototype._ptrUIDOMBase = $('<div class="' + ResosDecoratorConstants.POINTER_CLASS + '"><i class="glyphicon glyphicon-share"></i></div>');


    ResosDecoratorCore.prototype._updatePointers = function () {
        var ptrTo;

        if (this._getPointerNames().length > 0) {
            this.skinParts.$ptr = this.$el.find('.' + ResosDecoratorConstants.POINTER_CLASS);
            if (this.skinParts.$ptr.length === 0) {
                this.skinParts.$ptr = this._ptrUIDOMBase.clone();
                this.$el.append(this.skinParts.$ptr);
            }

            ptrTo = this._getPointerTargets();

            if (ptrTo.length > 0) {
                this.skinParts.$ptr.removeClass(ResosDecoratorConstants.POINTER_CLASS_NON_SET);
            } else {
                this.skinParts.$ptr.addClass(ResosDecoratorConstants.POINTER_CLASS_NON_SET);
            }
        } else {
            if (this.skinParts.$ptr) {
                this.skinParts.$ptr.remove();
                this.skinParts.$ptr = undefined;
            }
        }
    };


    //return all the pointer names (set or unset for this item other than the excluded ones)
    ResosDecoratorCore.prototype._getPointerNames = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            ptrNames = [];

        if (nodeObj) {
            ptrNames = _.difference(nodeObj.getPointerNames().slice(0), EXCLUDED_POINTERS);
        }

        return ptrNames;
    };

    //return all the pointer names that are valid pointers for the given target
    ResosDecoratorCore.prototype._getValidPointersForTarget = function (targetId) {
        var client = this._control._client,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            ptrNames = this._getPointerNames(),
            len = ptrNames.length,
            validPtrNames = [],
            p;

        while (len--) {
            p = ptrNames[len];
            if (client.isValidTarget(gmeID, p, targetId)) {
                validPtrNames.push(p);
            }
        }

        if (validPtrNames.length > 0) {
            validPtrNames.sort(function (a, b) {
                var ptrA = a.toLowerCase(),
                    ptrB = b.toLowerCase();
                if (ptrA < ptrB) {
                    return -1;
                } else if (ptrA > ptrB) {
                    return 1;
                }

                //must be equal
                return 0;
            });
        }

        return validPtrNames;
    };


    //return all the set pointer names and targets
    ResosDecoratorCore.prototype._getPointerTargets = function () {
        var pointerTargets = [],
            client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            ptrNames,
            len,
            ptrTo;

        if (nodeObj) {
            ptrNames = _.difference(nodeObj.getPointerNames().slice(0), EXCLUDED_POINTERS);
            len = ptrNames.length;
            while (len--) {
                ptrTo = nodeObj.getPointer(ptrNames[len]);
                if (ptrTo && ptrTo.to !== undefined && ptrTo.to !== null) {
                    pointerTargets.push([ptrNames[len], ptrTo.to]);
                }
            }

            if (pointerTargets.length > 0) {
                pointerTargets.sort(function (a,b) {
                    var ptrA = a[0].toLowerCase(),
                        ptrB = b[0].toLowerCase();
                    if (ptrA < ptrB) {
                        return -1;
                    } else if (ptrA > ptrB) {
                        return 1;
                    }

                    //must be equal
                    return 0;
                });
            }
        }

        return pointerTargets;
    };


    ResosDecoratorCore.prototype._setPointerTarget = function (targetID, mousePos) {
        var ptrNames = this._getValidPointersForTarget(targetID);

        if (ptrNames.length > 0) {
            //check to see if there is more than one potential pointer to set
            if (ptrNames.length === 1) {
                this._setPointer(ptrNames[0], targetID);
            } else {
                //there is multiple pointer names that are valid for this target
                //let the user pick one
                this._selectPointerForTarget(ptrNames, targetID, mousePos);
            }
        }
    };

    ResosDecoratorCore.prototype._setPointer = function (ptrName, targetID) {
        var client = this._control._client,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            nodeObj = client.getNode(gmeID),
            ptrVal = nodeObj.getPointer(ptrName);

        if (ptrVal !== targetID) {
            client.makePointer(gmeID, ptrName, targetID);
        }
    };

    ResosDecoratorCore.prototype._selectPointerForTarget = function (ptrNames, targetID, mousePos) {
        var logger = this.logger,
            menu,
            self = this,
            menuItems = {},
            i;

        for (i = 0; i < ptrNames.length; i += 1) {
            menuItems[ptrNames[i]] = {
                "name": "Set pointer '" + ptrNames[i] + "'"
            };
        }

        menu = new ContextMenu({'items': menuItems,
            'callback': function (key) {
                logger.debug('_selectPointerForTarget: ' + key);
                self._setPointer(key, targetID);
            }});

        menu.show({x: mousePos.left, y: mousePos.top});
    };

    ResosDecoratorCore.prototype._updateAbstract = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);

        if (nodeObj) {
            if (nodeObj.getRegistry(REGISTRY_KEYS.IS_ABSTRACT) === true) {
                this.$el.addClass(ABSTRACT_CLASS);
            } else {
                this.$el.removeClass(ABSTRACT_CLASS);
            }
        } else {
            this.$el.removeClass(ABSTRACT_CLASS);
        }
    };

    /***** UPDATE THE SVG ICON OF THE NODE *****/
    ResosDecoratorCore.prototype._updateSVG = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            svgFile = "",
            svgURL,
            self = this;

        if (nodeObj) {
            svgFile = nodeObj.getRegistry(REGISTRY_KEYS.SVG_ICON);
        }

        if (svgFile) {
            // get the svg from the server in SYNC mode, may take some time
            svgURL = SVG_DIR + svgFile;
            if (!this.skinParts.$imgSVG) {
                this.skinParts.$imgSVG = EMBEDDED_SVG_IMG_BASE.clone();
                this.$el.append(this.skinParts.$imgSVG);
            }
            if (this.skinParts.$imgSVG.attr('src') !== svgURL) {
                this.skinParts.$imgSVG.on('load', function (/*event*/) {
                    self._svgReady();
                });
                this.skinParts.$imgSVG.on('error', function (/*event*/) {
                    self._svgReady();
                });
                this.skinParts.$imgSVG.attr('src', svgURL);
            }
        } else {
            if (this.skinParts.$imgSVG) {
                this.skinParts.$imgSVG.remove();
                this.skinParts.$imgSVG = undefined;
            }
        }
    };

    ResosDecoratorCore.prototype._svgReady = function () {
        var portsHeight = this.skinParts.$portsContainer.outerHeight(),
            TOP_OFFSET = 5,
            marginTop = -portsHeight + TOP_OFFSET;

        this.skinParts.$imgSVG.css('margin-top', marginTop);

        this.skinParts.$imgSVG.off('load');
        this.skinParts.$imgSVG.off('error');

        if (_.isFunction(this.onRenderGetLayoutInfo)) {
            this.onRenderGetLayoutInfo();
        }
        if (this.hostDesignerItem &&
            this.hostDesignerItem.canvas) {
            var sel = this.hostDesignerItem.canvas.selectionManager.getSelectedElements();
            if (sel.length === 1 &&
                sel[0] === this.hostDesignerItem.id) {
                this.hostDesignerItem.canvas.selectNone();
                this.hostDesignerItem.canvas.select([this.hostDesignerItem.id]);
            }
        }
    };


    return ResosDecoratorCore;
});
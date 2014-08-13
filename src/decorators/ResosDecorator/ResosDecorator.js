/*
 * Copyright (C) 2014 Vanderbilt University, All rights reserved.
 *
 * Authors: Istvan Madari
 */

"use strict";

define(['js/Decorators/DecoratorBase',
    './DiagramDesigner/ResosDecorator.DiagramDesignerWidget',
    './PartBrowser/ResosDecorator.PartBrowserWidget'], function (
                                                           DecoratorBase,
                                                           ResosDecoratorDiagramDesignerWidget,
                                                           ResosDecoratorPartBrowserWidget) {

    var ResosDecorator,
        __parent__ = DecoratorBase,
        __parent_proto__ = DecoratorBase.prototype,
        DECORATOR_ID = "ResosDecorator";

    ResosDecorator = function (params) {
        var opts = _.extend( {"loggerName": this.DECORATORID}, params);

        __parent__.apply(this, [opts]);

        this.logger.debug("ResosDecorator ctor");
    };

    _.extend(ResosDecorator.prototype, __parent_proto__);
    ResosDecorator.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DecoratorBase MEMBERS **************************/

    ResosDecorator.prototype.initializeSupportedWidgetMap = function () {
        this.supportedWidgetMap = {'DiagramDesigner': ResosDecoratorDiagramDesignerWidget,
            'PartBrowser': ResosDecoratorPartBrowserWidget};
    };

    return ResosDecorator;
});
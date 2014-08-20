/**
 * Created by István on 8/20/2014.
 */

/*globals define, console, window, angular*/

define( [
    'angular',
    'text!./CodeEditorDialog.html'
], function ( ng, CodeEditorDialogTemplate ) {

    "use strict";

    angular.module(
        'resos.ui.codeEditorDialog',
        [ 'ui.bootstrap' ]
    ).provider( '$codeEditorDialog', function () {

            var $codeEditorDialogProvider = {
                options: {
                },
                $get: ['$modal',
                    function ( $modal ) {

                        var $codeEditorDialog = {},
                            CodeEditorDialogController;

                        CodeEditorDialogController = function ( $scope, $modalInstance,
                                                             dialogTitle, dialogContentTemplate, onOk, onCancel, validator ) {

                            $scope.dialogTitle = dialogTitle;
                            $scope.dialogContentTemplate = dialogContentTemplate;

                            $scope.ok = function () {
                                if ( angular.isFunction(validator) ? validator($scope) : true ) {
                                    $modalInstance.close();
                                    if ( angular.isFunction( onOk ) ) {
                                        onOk();
                                    }
                                }
                            };
                            $scope.cancel = function () {
                                $modalInstance.dismiss( 'cancel' );
                                if ( angular.isFunction( onCancel ) ) {
                                    onCancel();
                                }
                            };
                        };

                        $codeEditorDialog.open = function ( options ) {

                            var modalOptions = {
                                template: CodeEditorDialogTemplate,
                                controller: CodeEditorDialogController
                            };

                            modalOptions = angular.extend(modalOptions, options);

                            modalOptions.resolve = angular.extend(modalOptions.resolve || {
                                dialogTitle: function() { return options.dialogTitle; },
                                dialogContentTemplate: function() {  return options.dialogContentTemplate; },
                                onOk: function() { return options.onOk; },
                                onCancel: function() { return options.onCancel; },
                                validator: function() { return options.validator; }
                            });


                            var simpleDialogInstance = $modal.open( modalOptions );


                            return simpleDialogInstance;

                        };

                        return $codeEditorDialog;

                    }]
            };

            return $codeEditorDialogProvider;

        } );
} );

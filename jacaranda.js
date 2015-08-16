/**
 * Created by SunLunatic on 2014/11/7.
 */
(function ($) {
    var Jacaranda = function (element, options) {
        this.target = $(element);
        this.options = options;
        this.selectIds = {};
        this.init();
    };
    Jacaranda.prototype = {
        constructor: Jacaranda,
        init: function () {
            var that = this;
            var data = this.options.data;
            var htmlStr = '<div class="jcrd-tree"><div class="jcrd-tree-package-content">';
            this.options.isSynac = !!this.options.synac;
            $(data).each(function () {
                htmlStr += JcrdGlobal.renderToHtml(this, that.options, true);
            });
            htmlStr += '</div></div>';
            this.target.append(htmlStr);
            $(this.target).on("click", ".jcrd-tree-package-header", function (event) {
                that.toggle(event.currentTarget, that);
                event.stopPropagation();
            });
            $(this.target).on("click", ".jcrd-ico-choose", function (event) {
                that.choose(event.currentTarget, that);
                event.stopPropagation();
            });
        },
        toggle: function (parent, tree) {
            var $parent = $(parent);
            var $expandDom = $($parent.children()[0]);
            if ($expandDom.hasClass("fa-plus-square-o")) {
                return tree.expand($parent, tree);
            }
            if ($expandDom.hasClass("fa-minus-square-o")) {
                return tree.unexpand($parent, tree);
            }
        },
        expand: function ($parent, tree) {
            var $expandDom = $($parent.children()[0]);
            var $body = $($parent.children(".jcrd-tree-package-name")[0]);
            $expandDom.removeClass("fa-plus-square-o");
            if ($expandDom.attr("init") == "false") {
                $expandDom.addClass("fa-spinner").addClass("fa-spin");
                $.ajax({
                    url: tree.options.synac,
                    type: "POST",
                    dataType: "json",
                    data: {
                        parentId: $body.attr("data-id")
                    },
                    success: function (data) {
                        var dataObj = {children: data};
                        $expandDom.removeClass("fa-spinner");
                        $expandDom.removeClass("fa-spin");
                        $expandDom.addClass("fa-minus-square-o");
                        $expandDom.attr("init", "true");
                        $parent.after(JcrdGlobal.renderToHtml(dataObj, tree.options, false));
                        $expandDom.parent().next(".jcrd-tree-package-content").removeClass("jcrd-content-hide");
                    }
                });
            } else {
                $expandDom.addClass("fa-minus-square-o");
                $parent.next(".jcrd-tree-package-content").removeClass("jcrd-content-hide");
            }
        },
        unexpand: function ($parent, tree) {
            var $expandDom = $($parent.children()[0]);
            $expandDom.removeClass("fa-minus-square-o");
            $expandDom.addClass("fa-plus-square-o");
            $parent.next(".jcrd-tree-package-content").addClass("jcrd-content-hide");
        },
        choose: function (chooseIco, tree) {
            var $chooseIco = $(chooseIco);
            if ($chooseIco.parent().hasClass("jcrd-disabled")) return;
            var isChoose = $chooseIco.hasClass("fa-check-square-o");
            var $selectDom = $chooseIco.next();
            var id = $selectDom.attr("data-id");
            var isSelected = false;
            if (tree.options.modal == "radio" && !isChoose) {
                for(var key in tree.selectIds){
                    tree.unChoose($(JcrdUtil.findNode(tree, key)).prev(), tree, key);
                }
                tree.selectIds[id] = $selectDom.text().trim();
                $chooseIco.removeClass("fa-circle-o").addClass("fa-check-circle-o");
            }
            if (tree.options.modal == "checkbox") {
                if (isChoose) {
                    $chooseIco.removeClass("fa-check-square-o").addClass("fa-square-o");
                    tree.selectIds[id] = $selectDom.text().trim();
                    isSelected = true;
                } else {
                    tree.unChoose($chooseIco, tree, id);
                }
            }
            tree.target.trigger("jcrd.choose.after", [id, !isSelected, $selectDom]);
        },
        unChoose: function($hasChoosedIco, tree, nodeId){
            if(tree.options.modal == "radio"){
                $hasChoosedIco.removeClass("fa-check-circle-o").addClass("fa-circle-o");
            }
            if(tree.options.modal == "checkbox"){
                $hasChoosedIco.removeClass("fa-square-o").addClass("fa-check-square-o");
            }
            delete tree.selectIds[nodeId];
            tree.target.trigger("jcrd.unChecked.after", [nodeId, $hasChoosedIco.next()]);
        },
        select: function (selectIds, expand) {
            var tree = this;
            $(selectIds).each(function () {
                var treeNode = $(tree.target).find("#_jcrd_" + this);
                if (!expand && treeNode) {
                    $(treeNode).parents(".jcrd-tree-package").each(function () {
                        var view = $(this).find(".fa-plus-square-o")[0];
                        if (view) {
                            $(view).removeClass("fa-plus-square-o");
                            $(view).addClass("fa-minus-square-o");
                            $(view).parent().next(".jcrd-tree-package-content").removeClass("jcrd-content-hide");
                        }
                    });
                }
                $(treeNode).trigger("click");
            });
        },
        expandAll: function () {
            $(this.target).find(".jcrd-content-hide").each(function () {
                $(this).removeClass("jcrd-content-hide");
            });
            $(this.target).find(".fa-plus-square-o").each(function () {
                $(this).removeClass("fa-plus-square-o");
                $(this).addClass("fa-minus-square-o");
            });
        },
        closeAll: function () {
            $(this.target).find(".jcrd-tree-package-content").each(function () {
                $(this).addClass("jcrd-content-hide");
            });
            $(this.target).find(".fa-minus-square-o").each(function () {
                $(this).addClass("fa-plus-square-o");
                $(this).removeClass("fa-minus-square-o");
            });
        },
        destory: function () {
            this.target.removeData("_jcrdTree");
            this.target.off('click');
            $(this.target).find(".jcrd-tree").remove();
        }
    };
    $.fn.jacaranda = function (options) {
        if (!this.jcrdTree) {
            this.jcrdTree = new Jacaranda(this, $.extend({}, $.fn.jacaranda.defaults, options));
        }
        return this;
    };
    $.fn.jacaranda.defaults = {
        data: null,
        leaf: "leaf",
        children: "children",
        text: "name",
        synac: false,
        modal: "show"
    };
    var JcrdUtil = {
        constants : {
            idPrefix : "_jcrd_"
        },
        findNode: function(tree, nodeId){
            return tree.target.find("#"+JcrdUtil.constants.idPrefix + nodeId);
        }
    };
    var JcrdGlobal = {
        renderToHtml: function (dataObj, options, buildHead) {
            var htmlStr = [];
            var headerClass = ["jcrd-tree-package-header"];
            var nodeClass = ["jcrd-tree-package-name"];
            if (buildHead) {
                var treeNodeAttr = JcrdGlobal.parseAttrs(dataObj, options, headerClass, nodeClass);
                htmlStr.push('<div class="jcrd-tree-package"><div class="');
                htmlStr.push(headerClass.join(""));
                htmlStr.push('">');
                //是否包含下一级节点 leaf = true/false 优先级最高 当leaf未定义时根据是否有children决定
                if (dataObj[options.leaf] == "true" || (dataObj[options.leaf] == undefined && !dataObj[options.children])) {
                    htmlStr.push('<i class="fa"></i>');
                } else {
                    htmlStr.push('<i class="fa fa-plus-square-o fa-1x jcrd-ico-open" ');
                    if (options.isSynac) htmlStr.push('init="false" ');
                    htmlStr.push('></i>');
                }
                JcrdGlobal.parseModals(options.modal, htmlStr);
                htmlStr.push('<div ' + treeNodeAttr + ' class="');
                htmlStr.push(nodeClass.join(""));
                htmlStr.push('">');
                htmlStr.push(dataObj[options.text]);
                htmlStr.push('</div></div>');
            }

            if (dataObj[options["leaf"]] != "false" && dataObj[options["children"]]) {
                htmlStr.push('<div class="jcrd-tree-package-content jcrd-content-hide">');
                for (var childKey in dataObj[options.children]) {
                    htmlStr.push(JcrdGlobal.renderToHtml(dataObj[options.children][childKey], options, true));
                }
                htmlStr.push("</div>");
            }
            htmlStr.push("</div>");
            return htmlStr.join("");
        },
        parseModals: function(modal, htmlStr) {
            JcrdGlobal.parseFunctions[modal](htmlStr);
        },
        parseFunctions : {
            "show": function () {
            },
            "checkbox": function (htmlStr) {
                htmlStr.push('<i class="fa fa-square-o fa-lg jcrd-ico-choose"></i>');
            },
            "radio": function (htmlStr) {
                htmlStr.push('<i class="fa fa-circle-o fa-lg jcrd-ico-choose"></i>');
            }
        },
        parseAttrs: function (dataObj, params, headerClass, nodeClass) {
            var htmlStr = [];
            for (var key in dataObj) {
                if (!key || params.text == key || params.children == key) continue;
                var addAttrImpl = JcrdGlobal.addAttrImpls[key] || JcrdGlobal.addAttrImpls["default"];
                addAttrImpl(htmlStr, dataObj, key, headerClass);
            }
            return htmlStr.join("");
        },
        addAttrImpls: {
            "id": function (htmlStr, dataObj, key) {
                htmlStr.push(JcrdGlobal.addAttr("id", "_jcrd_" + dataObj[key]));
                htmlStr.push(JcrdGlobal.addAttr("data-id", dataObj[key]));
            },
            "disabled": function (htmlStr, dataObj, key, headerClass) {
                if (dataObj[key] == "true")headerClass.push(" jcrd-disabled");
            },
            "default": function (htmlStr, dataObj, key) {
                htmlStr.push(JcrdGlobal.addAttr(key, dataObj[key]));
            }
        },
        addAttr: function (attName, attVal) {
            return attName + '="' + attVal + '" ';
        }

    };
})(jQuery);
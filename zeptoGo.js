(function(global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function() { return factory(global) })
  else
    factory(global)
}(this, function(window) {
  var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    adjacencyOperators = ['after', 'prepend', 'before', 'append'],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
        'tr': document.createElement('tbody'),
        'tbody': table, 'thead': table, 'tfoot': table,
        'td': tableRow, 'th': tableRow,
        '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
        function(object){ return object instanceof Array }

    zepto.matches = function(element, selector){
        if(!selector || !element || element.nodeType !== 1) return false // nodeType === 1 元素节点
        var matchesSelector = element.matches || element.webkitMatchesSelector ||
                              element.mozMatchesSelector || element.oMatchesSelector ||
                              element.matchesSelector
        if(matchesSelector) return matchesSelector.call(element, selector)
        var match, parent = element.parentNode, temp = !parent
        if(temp) (parent = tempParent).appendChild(element)
        match = ~zepto.qsa(parent, selector).indexOf(element) // 取整
        temp && tempParent.removeChild(element)
        return match
    }

    function type(obj){
        return obj == null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) { return type(value) == "function" }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT.NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj){
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    function likeArray(obj){
        var length = !!obj && 'length' in obj && obj.length,
            type = $.type(obj)

        return 'function' != type && !isWindow(obj) && (
            'array' == type || length === 0 ||
                (typeof length == 'number' && length > 0 && (length - 1) in obj)
        )
    }

    function compact(array) { return filter.call(array, function(item){ return item != null }) }
    function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
    camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) } // 转为驼峰命名
    function dasherize(str){
        return str.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/_/g, '-')
               .toLowerCase()
    }
    // 去重，如果某个元素'x'的 indexOf不等于他本身所在的位置，也就是说有多个'x'，则只会返回第一个（因为只有第一个的indexOf等于他本身的位置）
    uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

    function classRE(name){
        return name in classCache ?
            classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    function maybeAddPx(name, value){
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + 'px' : value
    }

    function defaultDisplay(nodeName){
        var element, display
        if(!elementDisplay[nodeName]){
            element = document.createElement(nodeName)
            // 把element加入文档，然后获取其display属性，然后移除element
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            // 相当于 if(display=='none') display = 'block' else display = 'none';
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDislay[nodeName]
    }

    function children(element){
        return 'children' in element ?
            slice.call(element.children) :
            $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
    }

    function Z(dom, selector){
        var i, len = dom ? dom.length : 0
        for (i = 0; i < len; i++) this[i] = dom[i]
        this.length = len
        this.selector = selector || ''
    }

    zepto.fragment = function(html, name, properties){
        var dom, nodes, container

        if(singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

        if(!dom){
            if(html.replace) html = html.replace(tagExpanderRe, "<$1></$2>")
            if(name === undefined) name = fragmentRE.test(html) && RegExp.$1
            if(!(name in containers)) name = '*'

            container = containers[name]
            container.innerHTML = '' + html
            dom = $.each(slice.call(container.childNodes), function(){
                container.removeChild(this)
            })
        }

        if(isPlainObject(properties)){
            nodes = $(dom)
            $.each(properties, function(key, value){
                if(methodAttributes.indexOf(key) > -1) nodes[key](value)
                else nodes.attr(key, value)
            })
        }
        return dom
    }

    zepto.Z = function(dom, selector){
        return new Z(dom, selector)
    }

    zepto.isZ = function(object){
        return object instanceof zepto.Z
    }

    zepto.init = function(selector, context){
        var dom
        if(!selector) return zepto.Z()
        else if(typeof selector == 'string'){
            selector = selector.trim()
            if(selector[0] == '<' && fragmentRE.test(selector))
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null
            else if(context !== undefined) return $(context).find(selector)
            else dom = zepto.qsa(document, selector)
        }
        else if(isFunction(selector)) return $(document).ready(selector)
        else if(zepto.isZ(selector)) return selector
        else {
            if(isArray(selector)) dom = compact(selector)
            else if(isObject(selector))
                dom = [selector], selector = null
            else if(fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            else if(context !== undefined) return $(context).find(selector)
            else dom = zepto.qsa(document, selector)
        }
        return zepto.Z(dom, selector)
    }
    $ = function(selector, context){
        return zepto.init(selector, context)
    }

    function extend(target, source, deep){
        for(key in source)
            if(deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if(isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if(isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
            else if(source[key] !== undefined) target[key] = source[key]
    }

    $.extend = function(target){
        var deep, args = slice.call(arguments, 1)
        if(typeof target == 'boolean'){
            deep = target
            target = args.shift()
        }
        args.forEach(function(arg){ extend(target, arg, deep) })
        return target
    }

    zepto.qsa = function(element, selector){
        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
            nameOnly = maybeID || maybeClass ? selector.slice(1) :selector,
            isSimple = simpleSelectorRE.test(nameOnly)
            return (element.getElementById && isSimple && maybeID) ?
            ( (found = element.getElementById(nameOnly)) ? [found] : [] ):
            (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
            slice.call(
                isSimple && !maybeID && element.getElementsByClassName ?
                    maybeClass ? element.getElementsByClassName(nameOnly) :
                    element.getElementsByTagName(selector) :
                    element.querySelectorAll(selector)
            )
    }

    function filtered(nodes, selector){
        return selector == null ? $(nodex) : $(nodex).filter(selector)
    }

    $.contains = document.documentElement.contains ?
        function(parent, node){
            return parent !== node && parent.contains(node)
        } :
        function(parent, node){
            while(node && (node = node.parentNode))
            if(node === parent) return true
            return false
        };

    function funcArg(context, arg, idx, payload){
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value){
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    function className(node, value){
        var klass = node.className || '',
            svg   = klass && klass.baseVal !== undefined

        if(value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // 反序列化
    function deserializeValue(value){
        try{
            return value ?
            value == 'true' ||
            ( value == 'false' ? false :
            value == 'null' ? null :
            +value + "" == value ? +value :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :
                value )
                : value
        } catch(e){
                return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    $.isEmptyObject = function(obj){
        var name
        for(name in obj) return false
        return true
    }

    $.isNumeric = function(val){
        var num = Number(val), type = typeof val
        return val != null && type != 'boolean' &&
        (type != 'string' || val.length) &&
        !isNaN(num) && isFinite(num) || false
    }

    $.inArray = function(elem, array, i){
        return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize
    $.trim = function(str){
        return str == null ? "" : String.prototype.trim.call(str)
    }

    $.uuid = 0
    $.support = { }
    $.expr = { }
    $.noop = function(){}

    $.map = function(elements, callback){
        var value, values = [], i, key
        if(likeArray(elements))
            for(i = 0; i < elements.length; i++){
                value = callback(elements[i], i)
                if(value != null) values.push(value)
            }
        else
            for( key in elements){
                value = callback(elements[key], key)
                if( value != null) values.push(value)
            }
        return flatten(values)
    }

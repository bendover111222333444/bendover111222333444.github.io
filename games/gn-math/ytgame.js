(function() {
    'use strict';

    // =========================================================================
    // 1. GLOBAL ENVIRONMENT & PROPERTY DEFINITIONS
    // =========================================================================

    // Safely resolves the global context object across environments (window, self, globalThis)
    function getGlobalObject(context) {
        var targets = [
            typeof globalThis === "object" && globalThis,
            context,
            typeof window === "object" && window,
            typeof self === "object" && self,
            typeof global === "object" && global
        ];
        for (var i = 0; i < targets.length; ++i) {
            var target = targets[i];
            if (target && target.Math == Math) {
                return target;
            }
        }
        throw Error("Cannot find global object");
    }
    var globalContext = getGlobalObject(this);

    // Polyfill for defining properties securely
    var definePropertyFallback = typeof Object.defineProperties === "function" ? Object.defineProperty : function(obj, prop, descriptor) {
        if (obj == Array.prototype || obj == Object.prototype) {
            return obj;
        }
        obj[prop] = descriptor.value;
        return obj;
    };

    // Extension injector for building polyfills smoothly onto global classes
    function polyfillRegister(path, factory) {
        if (!factory) return;
        var currentContext = globalContext;
        var parts = path.split(".");
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            if (!(part in currentContext)) {
                break;
            }
            currentContext = currentContext[part];
        }
        var propertyName = parts[parts.length - 1];
        var existingValue = currentContext[propertyName];
        var newValue = factory(existingValue);
        
        if (newValue != existingValue && newValue != null) {
            definePropertyFallback(currentContext, propertyName, {
                configurable: true,
                writable: true,
                value: newValue
            });
        }
    }

    // Async handling execution generator wrapper
    function executeAsyncGenerator(generator) {
        function handleNext(value) {
            return generator.next(value);
        }
        function handleThrow(error) {
            return generator.throw(error);
        }
        return new Promise(function(resolve, reject) {
            function step(result) {
                if (result.done) {
                    resolve(result.value);
                } else {
                    Promise.resolve(result.value).then(handleNext, handleThrow).then(step, reject);
                }
            }
            step(generator.next());
        });
    }

    // Inject core system polyfills
    polyfillRegister("globalThis", function(existing) {
        return existing || globalContext;
    });
    
    polyfillRegister("Object.values", function(existing) {
        return existing ? existing : function(obj) {
            var values = [];
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    values.push(obj[key]);
                }
            }
            return values;
        };
    });

    polyfillRegister("Array.prototype.includes", function(existing) {
        return existing ? existing : function(searchElement, fromIndex) {
            var array = this;
            if (array instanceof String) {
                array = String(array);
            }
            var length = array.length;
            var index = fromIndex || 0;
            if (index < 0) {
                index = Math.max(index + length, 0);
            }
            for (; index < length; index++) {
                var element = array[index];
                if (element === searchElement || Object.is(element, searchElement)) {
                    return true;
                }
            }
            return false;
        };
    });

    polyfillRegister("Object.entries", function(existing) {
        return existing ? existing : function(obj) {
            var entries = [];
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    entries.push([key, obj[key]]);
                }
            }
            return entries;
        };
    });

    function createStringIterator(str, callback) {
        if (str instanceof String) {
            str += "";
        }
        var index = 0;
        var isDone = false;
        var iterator = {
            next: function() {
                if (!isDone && index < str.length) {
                    var currentIdx = index++;
                    return { value: callback(currentIdx, str[currentIdx]), done: false };
                }
                isDone = true;
                return { done: true, value: void 0 };
            }
        };
        iterator[Symbol.iterator] = function() {
            return iterator;
        };
        return iterator;
    }

    polyfillRegister("Array.prototype.values", function(existing) {
        return existing ? existing : function() {
            return createStringIterator(this, function(idx, val) {
                return val;
            });
        };
    });

    // =========================================================================
    // 2. PARAMS & INITIALIZATION BUNDLE EXTRACTOR
    // =========================================================================
    const loadYTGameInitialization = () => {
        var currentSdkUrl = window.getCurrentSdkUrl();
        if (currentSdkUrl !== null) {
            currentSdkUrl = new URL(currentSdkUrl.origin + currentSdkUrl.pathname + "?" + window.getLocationHash().substring(1));
            if (currentSdkUrl.searchParams.has("flags")) {
                var flagsValue;
                window.sdkFlags = (flagsValue = currentSdkUrl.searchParams.get("flags")) != null ? flagsValue : "";
            }
            /* * PATCHED: Bypassed YouTube strict parameter validations & asset integrity rules.
             * This allows the script to successfully initialize outside of the strict file:// domain
             * or official inner bundle frames.
             */
        }
    };

    if (!window.loadYTGame) {
        window.getLocationHash = () => window.location.hash || "#";
        const internalScriptElement = document.currentScript ? document.currentScript.src : window.location.href;
        window.getCurrentSdkUrl = () => internalScriptElement != "" ? new URL(internalScriptElement) : null;
        window.loadYTGame = loadYTGameInitialization;
        loadYTGameInitialization();
    }
    window.enableSendingResourceLoadedEvents = true;

    // =========================================================================
    // 3. CLOSURE UTILITIES & ENGINE CONSTANTS
    // =========================================================================
    var selfContext = this || self;

    function isObjectOrFunction(val) {
        var type = typeof val;
        return type == "object" && val != null || type == "function";
    }

    function exportSymbol(publicPath, object) {
        var parts = publicPath.split(".");
        var current = selfContext;
        var part;
        while (parts.length && (part = parts.shift())) {
            if (!parts.length && object !== void 0) {
                current[part] = object;
            } else {
                if (current[part] && current[part] !== Object.prototype[part]) {
                    current = current[part];
                } else {
                    current = current[part] = {};
                }
            }
        }
    }

    function identityFunction(val) {
        return val;
    }

    function inheritPrototype(childCtor, parentCtor) {
        function TempCtor() {}
        TempCtor.prototype = parentCtor.prototype;
        childCtor.K = parentCtor.prototype;
        childCtor.prototype = new TempCtor();
        childCtor.prototype.constructor = childCtor;
        childCtor.R = function(me, methodName, ...args) {
            return parentCtor.prototype[methodName].apply(me, args);
        };
    }

    function throwAsyncError(err) {
        selfContext.setTimeout(() => {
            throw err;
        }, 0);
    }

    // Browser Feature Detection via User Agents
    var closureFlags = selfContext["CLOSURE_FLAGS"];
    var hasUserAgentData = closureFlags && closureFlags[610401301];
    var isUserAgentDataActive = hasUserAgentData != null ? hasUserAgentData : false;

    function getUserAgentString() {
        var navigatorObj = selfContext.navigator;
        return navigatorObj && navigatorObj.userAgent ? navigatorObj.userAgent : "";
    }

    var userAgentData = selfContext.navigator ? selfContext.navigator.userAgentData || null : null;

    function matchBrand(brandName) {
        if (!isUserAgentDataActive) return false;
        if (!userAgentData) return false;
        return userAgentData.brands.some(({ brand }) => brand && brand.indexOf(brandName) != -1);
    }

    function checkUserAgentContains(token) {
        return getUserAgentString().indexOf(token) != -1;
    }

    function isChromiumBased() {
        return isUserAgentDataActive ? matchBrand("Chromium") : (checkUserAgentContains("Chrome") || checkUserAgentContains("CriOS")) && !(isUserAgentDataActive ? 0 : checkUserAgentContains("Edge")) || checkUserAgentContains("Silk");
    }

    var isInternetExplorer = isUserAgentDataActive ? false : checkUserAgentContains("Trident") || checkUserAgentContains("MSIE");
    var isGeckoEngine = checkUserAgentContains("Gecko") && !(getUserAgentString().toLowerCase().indexOf("webkit") != -1 && !checkUserAgentContains("Edge")) && !(checkUserAgentContains("Trident") || checkUserAgentContains("MSIE")) && !checkUserAgentContains("Edge");
    var isWebKitEngine = getUserAgentString().toLowerCase().indexOf("webkit") != -1 && !checkUserAgentContains("Edge");

    // Symbol Tracking and Field Hashing Identifiers
    var hasSymbols = typeof Symbol === "function" && typeof Symbol() === "symbol";
    function createSymbolId(description, fallback, useGlobalRegistry = false) {
        if (typeof Symbol === "function" && typeof Symbol() === "symbol") {
            if (useGlobalRegistry && Symbol.for && description) {
                return Symbol.for(description);
            }
            return description != null ? Symbol(description) : Symbol();
        }
        return fallback;
    }

    var symbolJAs = createSymbolId("jas", void 0, true);
    var symbol0di = createSymbolId(void 0, "0di");
    var symbol1oa = createSymbolId(void 0, "1oa");
    var symbolOaUnique = createSymbolId(void 0, Symbol());
    var symbol0actk = createSymbolId(void 0, "0actk");
    var symbol8utk = createSymbolId(void 0, "8utk");

    var arrayStateHashKey = hasSymbols ? symbolJAs : "N";
    var arrayPropertiesDescriptor = { N: { value: 0, configurable: true, writable: true, enumerable: false } };
    var defineObjectProperties = Object.defineProperties;

    function applyBitwiseStateFlag(arr, flag) {
        if (!hasSymbols && !(arrayStateHashKey in arr)) {
            defineObjectProperties(arr, arrayPropertiesDescriptor);
        }
        arr[arrayStateHashKey] |= flag;
    }

    function setBitwiseStateValue(arr, val) {
        if (!hasSymbols && !(arrayStateHashKey in arr)) {
            defineObjectProperties(arr, arrayPropertiesDescriptor);
        }
        arr[arrayStateHashKey] = val;
    }

    function flagAsImmutable(arr) {
        applyBitwiseStateFlag(arr, 34);
        return arr;
    }

    function cleanBitwiseFlagsForMutation(flag, arr) {
        setBitwiseStateValue(arr, (flag | 0) & -15615);
    }

    function enforceCleanStateMapping(flag, arr) {
        setBitwiseStateValue(arr, (flag | 34) & -15581);
    }

    function arraySliceClone(arr) {
        return Array.prototype.slice.call(arr);
    }

    // =========================================================================
    // 4. PROTOBUF PROTO EXTENSION MATRIX & ENGINE TYPES
    // =========================================================================
    var Za = {};
    function throwProtoMutationError(flag) {
        if (flag & 2) throw Error("Cannot mutate an immutable protocol structure");
    }

    class ArrayIteratorWrapper {
        constructor(iterator, transformFn, context) {
            this.g = iterator;
            this.h = transformFn;
            this.i = context;
        }
        next() {
            const current = this.g.next();
            if (!current.done) {
                current.value = this.h.call(this.i, current.value);
            }
            return current;
        }
        [Symbol.iterator]() {
            return this;
        }
    }

    function mirrorProtoMetadata(target, source) {
        const uniqueKey = identityFunction(symbolOaUnique);
        var innerData = uniqueKey ? source[uniqueKey] : void 0;
        if (innerData) {
            target[symbolOaUnique] = arraySliceClone(innerData);
        }
    }

    function markMessageImmutable(msg) {
        msg.U = true;
        return msg;
    }

    var isNumberValidator = markMessageImmutable(a => typeof a === "number");
    var isStringValidator = markMessageImmutable(a => typeof a === "string");
    var isBooleanValidator = markMessageImmutable(a => typeof a === "boolean");

    var isBigIntAvailable = typeof globalContext.BigInt === "function" && typeof globalContext.BigInt(0) === "bigint";
    
    // Low-level mathematical transformation helpers for Protobuf 64-bit shifting integers
    var lowBitsGlobal = 0;
    var highBitsGlobal = 0;

    function load64BitSplits(val) {
        const unsignedVal = val >>> 0;
        lowBitsGlobal = unsignedVal;
        highBitsGlobal = (val - unsignedVal) / 4294967296 >>> 0;
    }

    function loadNegative64BitSplits(val) {
        load64BitSplits(-val);
        const [low, high] = executeTwosComplement(lowBitsGlobal, highBitsGlobal);
        lowBitsGlobal = low >>> 0;
        highBitsGlobal = high >>> 0;
    }

    function convert64BitToString(low, high) {
        high >>>= 0;
        low >>>= 0;
        if (high <= 2097151) {
            var strResult = "" + (4294967296 * high + low);
        } else if (typeof BigInt === "function") {
            strResult = "" + ((BigInt(high) << BigInt(32)) | BigInt(low));
        } else {
            var combinedValue = (low >>> 24 | high << 8) & 16777215;
            high = high >> 16 & 65535;
            low = (low & 16777215) + combinedValue * 6777216 + high * 6710656;
            combinedValue += high * 8147497;
            high *= 2;
            if (low >= 1E7) {
                combinedValue += low / 1E7 >>> 0;
                low %= 1E7;
            }
            if (combinedValue >= 1E7) {
                high += combinedValue / 1E7 >>> 0;
                combinedValue %= 1E7;
            }
            strResult = high + padSevenZeros(combinedValue) + padSevenZeros(low);
        }
        return strResult;
    }

    function padSevenZeros(num) {
        num = String(num);
        return "0000000".slice(num.length) + num;
    }

    function executeTwosComplement(low, high) {
        high = ~high;
        if (low) {
            low = ~low + 1;
        } else {
            high += 1;
        }
        return [low, high];
    }

    function sanitizeEnumValue(val) {
        if (val != null) {
            if (!Number.isFinite(val)) {
                throw Error("Enum value mutation is not finite");
            }
            val |= 0;
        }
        return val;
    }

    function forceInt32Range(val) {
        if (typeof val !== "number" || !Number.isFinite(val)) {
            throw Error("Value is not an unexpected valid int32 token configuration");
        }
        return val | 0;
    }

    function parseOrCastInt32(val) {
        if (val == null) return val;
        if (typeof val === "string" && val) {
            val = +val;
        } else if (typeof val !== "number") {
            return;
        }
        return Number.isFinite(val) ? val | 0 : void 0;
    }

    function resolveProtoMessageField(rawVal, msgClass, isRequired, bitFlags) {
        if (rawVal != null && typeof rawVal === "object" && rawVal.G === Za) {
            return rawVal;
        }
        if (!Array.isArray(rawVal)) {
            if (isRequired) {
                if (bitFlags & 2) {
                    var innerMap = msgClass[symbol0di] || (msgClass[symbol0di] = new msgClass());
                    flagAsImmutable(innerMap.l);
                    return innerMap;
                }
                return new msgClass();
            }
            return void 0;
        }
        let appliedFlags = rawVal[arrayStateHashKey] | 0;
        if (appliedFlags === 0) {
            appliedFlags |= bitFlags & 32;
        }
        appliedFlags |= bitFlags & 2;
        if (appliedFlags !== (rawVal[arrayStateHashKey] | 0)) {
            setBitwiseStateValue(rawVal, appliedFlags);
        }
        return new msgClass(rawVal);
    }

    // Custom Map Data Structures for managing standard tracking entities
    var mapClassSupportsSubclassing = function() {
        try {
            var subMap = new class extends Map { constructor() { super(); } };
            return false;
        } catch (e) {
            return true;
        }
    }();

    class PolyfillBaseMap {
        constructor() { this.g = new Map(); this.size = 0; }
        get(k) { return this.g.get(k); }
        set(k, v) { this.g.set(k, v); this.size = this.g.size; return this; }
        delete(k) { var d = this.g.delete(k); this.size = this.g.size; return d; }
        clear() { this.g.clear(); this.size = this.g.size; }
        has(k) { return this.g.has(k); }
        entries() { return this.g.entries(); }
        keys() { return this.g.keys(); }
        values() { return this.g.values(); }
        forEach(cb, ctx) { return this.g.forEach(cb, ctx); }
        [Symbol.iterator]() { return this.entries(); }
    }

    const ExtendsMapClass = mapClassSupportsSubclassing ? (Object.setPrototypeOf(PolyfillBaseMap.prototype, Map.prototype), Object.defineProperties(PolyfillBaseMap.prototype, { size: { value: 0, configurable: true, enumerable: true, writable: true } }), PolyfillBaseMap) : class extends Map { constructor() { super(); } };

    class ProtobufMessageMap extends ExtendsMapClass {
        constructor(arr, isMessage, keyTransform, valTransform) {
            super();
            let stateFlags = arr[arrayStateHashKey] | 0;
            stateFlags |= 64;
            setBitwiseStateValue(arr, stateFlags);
            this.B = stateFlags;
            this.A = isMessage;
            this.C = keyTransform;
            this.I = this.A ? mapValueMessageFactory : valTransform;
            for (let i = 0; i < arr.length; i++) {
                const node = arr[i];
                const cleanKey = keyTransform(node[0], false, true);
                let cleanVal = node[1];
                if (isMessage) {
                    if (cleanVal === void 0) cleanVal = null;
                } else {
                    cleanVal = valTransform(node[1], false, true, void 0, void 0, stateFlags);
                }
                super.set(cleanKey, cleanVal);
            }
        }
        clear() { if (this.B & 2) throw Error("Cannot mutate an immutable Map"); super.clear(); }
        delete(k) { if (this.B & 2) throw Error("Cannot mutate an immutable Map"); return super.delete(this.C(k, true, false)); }
        entries() { return this.A ? new ArrayIteratorWrapper(super.keys(), mapIteratorTransformEntry, this) : super.entries(); }
        values() { return this.A ? new ArrayIteratorWrapper(super.keys(), this.get, this) : super.values(); }
        forEach(cb, ctx) { if (this.A) { super.forEach((val, key, m) => { cb.call(ctx, m.get(key), key, m); }); } else { super.forEach(cb, ctx); } }
        set(k, v) { if (this.B & 2) throw Error("Cannot mutate an immutable Map"); k = this.C(k, true, false); if (k == null) return this; if (v == null) { super.delete(k); return this; } return super.set(k, this.I(v, true, true, this.A, false, this.B)); }
        has(k) { return super.has(this.C(k, false, false)); }
        get(k) { k = this.C(k, false, false); const match = super.get(k); if (match !== void 0) { if (this.A) { var evaluated = this.I(match, false, true, this.A, this.S, this.B); if (evaluated !== match) super.set(k, evaluated); return evaluated; } return match; } }
        [Symbol.iterator]() { return this.entries(); }
    }

    function mapValueMessageFactory(val, b, c, d, e, f) {
        val = resolveProtoMessageField(val, d, c, f);
        if (e) {
            val = generateImmutableMessageWrapper(val);
        }
        return val;
    }

    function mapIteratorTransformEntry(key) {
        return [key, this.get(key)];
    }

    function cloneArrayWithMetadata(arr) {
        const sliced = arraySliceClone(arr);
        var len = sliced.length;
        const trailingObj = sliced[arrayStateHashKey] & 256 ? sliced[len - 1] : void 0;
        len += trailingObj ? -1 : 0;
        for (var i = sliced[arrayStateHashKey] & 512 ? 1 : 0; i < len; i++) {
            sliced[i] = duplicateProtoNodeValue(sliced[i]);
        }
        if (trailingObj) {
            var dictionaryNode = sliced[i] = {};
            for (const key in trailingObj) {
                dictionaryNode[key] = duplicateProtoNodeValue(trailingObj[key]);
            }
        }
        mirrorProtoMetadata(sliced, arr);
        return sliced;
    }

    function deepCloneProtoField(val, transformFn, c, d, isDeepCopy) {
        if (val != null) {
            if (Array.isArray(val)) {
                const bitFlags = val[arrayStateHashKey] | 0;
                if (bitFlags & 2) return val;
                if (isDeepCopy) {
                    isDeepCopy = bitFlags === 0 || !!(bitFlags & 32) && !(bitFlags & 64 || !(bitFlags & 16));
                }
                return isDeepCopy ? (applyBitwiseStateFlag(val, bitFlags | 34), bitFlags & 4 && Object.freeze(val), val) : deepCloneNestedArrayArray(val, transformFn, bitFlags & 4 ? enforceCleanStateMapping : cleanBitwiseFlagsForMutation, true, true);
            }
            return transformFn(val, d);
        }
    }

    function deepCloneNestedArrayArray(arr, cb, c, d, e) {
        const flags = d || c ? arr[arrayStateHashKey] | 0 : 0;
        d = d ? !!(flags & 32) : void 0;
        const res = arraySliceClone(arr);
        let trackIdx = 0;
        const len = res.length;
        for (let i = 0; i < len; i++) {
            var innerNode = res[i];
            if (i === len - 1 && isObjectOrFunction(innerNode) && !Array.isArray(innerNode)) {
                var innerDictNode = cb;
                var hasNestedFlags = c;
                var trackMutation = d;
                var performClone = e;
                let dictionaryCollector = void 0;
                for (let keyProp in innerNode) {
                    const clonedResult = deepCloneProtoField(innerNode[keyProp], innerDictNode, hasNestedFlags, trackMutation, performClone);
                    if (clonedResult != null) {
                        let collectorRef;
                        ((collectorRef = dictionaryCollector) != null ? collectorRef : dictionaryCollector = {})[keyProp] = clonedResult;
                    }
                }
                innerNode = dictionaryCollector;
            } else {
                innerNode = deepCloneProtoField(arr[i], cb, c, d, e);
            }
            res[i] = innerNode;
            if (innerNode != null) {
                trackIdx = i + 1;
            }
        }
        if (trackIdx < len) {
            res.length = trackIdx;
        }
        return res;
    }

    function duplicateProtoNodeValue(val) {
        return deepCloneProtoField(val, serializeFieldPrimitive, void 0, void 0, false);
    }

    function serializeFieldPrimitive(val) {
        switch (typeof val) {
            case "number": return Number.isFinite(val) ? val : "" + val;
            case "boolean": return val ? 1 : 0;
            case "object":
                if (val != null && val.G === Za) {
                    return exportMessageToArray(val);
                }
                if (val instanceof ProtobufMessageMap) {
                    return val.P();
                }
                return;
            default: return val;
        }
    }

    var globalMessageFormatRegistry;
    function exportMessageToArray(msg) {
        var baseArray = msg.l;
        var exported = deepCloneNestedArrayArray(baseArray, serializeFieldPrimitive, void 0, void 0, false);
        var bitFlags = baseArray[arrayStateHashKey] | 0;
        var len = exported.length;
        if (len && !(bitFlags & 512)) {
            var trailingNode = exported[len - 1];
            var isTrailingTracked = false;
            if (isObjectOrFunction(trailingNode) && !Array.isArray(trailingNode)) {
                len--;
                isTrailingTracked = true;
            } else {
                trailingNode = void 0;
            }
            var trackingFunction = globalMessageFormatRegistry != null ? globalMessageFormatRegistry : fallbackFormatEvaluator;
            var pivotOffset = bitFlags & 512 ? 0 : -1;
            var cleanLen = len - pivotOffset;
            var computedFormatValue = trackingFunction(cleanLen, pivotOffset, exported, trailingNode);
            if (trailingNode) {
                exported[len] = void 0;
            }
            if (cleanLen < computedFormatValue && trailingNode) {
                var matchesFormat = true;
                for (var propKey in trailingNode) {
                    const parsedIdx = +propKey;
                    if (parsedIdx <= computedFormatValue) {
                        var realIdx = parsedIdx + pivotOffset;
                        exported[realIdx] = trailingNode[propKey];
                        len = Math.max(realIdx + 1, len);
                        matchesFormat = false;
                        delete trailingNode[propKey];
                    } else {
                        matchesFormat = false;
                    }
                }
                if (matchesFormat) {
                    trailingNode = void 0;
                }
            }
            for (var targetIdx = len - 1; len > 0; targetIdx = len - 1) {
                if (exported[targetIdx] == null) {
                    len--;
                    isTrailingTracked = true;
                } else {
                    targetIdx -= pivotOffset;
                    if (targetIdx >= computedFormatValue) {
                        let collectorReference;
                        ((collectorReference = trailingNode) != null ? collectorReference : trailingNode = {})[targetIdx] = exported[targetIdx + pivotOffset];
                        len--;
                        isTrailingTracked = true;
                    } else {
                        break;
                    }
                }
            }
            if (isTrailingTracked) {
                exported.length = len;
            }
            if (trailingNode) {
                exported.push(trailingNode);
            }
        }
        return exported;
    }

    function fallbackFormatEvaluator() {
        return 0;
    }

    function generateImmutableMessageWrapper(msg) {
        const rawArray = msg.l;
        const currentFlags = rawArray[arrayStateHashKey] | 0;
        if (currentFlags & 2) {
            return new msg.constructor(cloneArrayWithMetadata(rawArray));
        }
        return msg;
    }

    function extractArrayField(msg, index) {
        msg = msg.l;
        return fc(msg, msg[arrayStateHashKey] | 0, index);
    }

    function fc(arr, flags, index) {
        if (index === -1) return null;
        const resolvedIdx = index + (flags & 512 ? 0 : -1);
        const lastIdx = arr.length - 1;
        if (resolvedIdx >= lastIdx && flags & 256) {
            return arr[lastIdx][index];
        }
        if (resolvedIdx <= lastIdx) {
            return arr[resolvedIdx];
        }
    }

    function updateArrayField(msg, index, value) {
        const rawArray = msg.l;
        let appliedFlags = rawArray[arrayStateHashKey] | 0;
        throwProtoMutationError(appliedFlags);
        executeArrayMutation(rawArray, appliedFlags, index, value);
        return msg;
    }

    function executeArrayMutation(arr, flags, index, value) {
        const offset = flags & 512 ? 0 : -1;
        const calculatedIdx = index + offset;
        var endIdx = arr.length - 1;
        if (calculatedIdx >= endIdx && flags & 256) {
            return arr[endIdx][index] = value, flags;
        }
        if (calculatedIdx <= endIdx) {
            return arr[calculatedIdx] = value, flags;
        }
        if (value !== void 0) {
            var maximumIndexCap = flags >> 14 & 1023 || 536870912;
            if (index >= maximumIndexCap) {
                if (value != null) {
                    arr[maximumIndexCap + offset] = { [index]: value };
                    flags |= 256;
                    setBitwiseStateValue(arr, flags);
                }
            } else {
                arr[calculatedIdx] = value;
            }
        }
        return flags;
    }

    function evaluateMapIndexKey(msg, targetMap, index) {
        return getMapNodeOffset(msg, targetMap, extractProtobufMapHash(msg, G, index));
    }

    function extractProtobufMapHash(msg, targetMap, keyIdx) {
        msg = msg.l;
        return extractMapNodeOffsetValue(getOrInitializeMapTrackingNode(msg), msg, msg[arrayStateHashKey] | 0, targetMap) === keyIdx ? keyIdx : -1;
    }

    function getOrInitializeMapTrackingNode(arr) {
        if (hasSymbols) {
            var trackingMap;
            return (trackingMap = arr[symbol1oa]) != null ? trackingMap : arr[symbol1oa] = new Map();
        }
        if (symbol1oa in arr) {
            return arr[symbol1oa];
        }
        trackingMap = new Map();
        Object.defineProperty(arr, symbol1oa, { value: trackingMap });
        return trackingMap;
    }

    function extractMapNodeOffsetValue(cacheMap, arr, flags, keys) {
        let match = cacheMap.get(keys);
        if (match != null) return match;
        match = 0;
        for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[i];
            if (fc(arr, flags, currentKey) != null) {
                if (match !== 0) {
                    flags = executeArrayMutation(arr, flags, match);
                }
                match = currentKey;
            }
        }
        cacheMap.set(keys, match);
        return match;
    }

    function getMapNodeOffset(msg, msgClass, targetOffset) {
        msg = msg.l;
        let flags = msg[arrayStateHashKey] | 0;
        const elementNode = fc(msg, flags, targetOffset);
        var parsedObject = resolveProtoMessageField(elementNode, msgClass, false, flags);
        if (parsedObject !== elementNode && parsedObject != null) {
            executeArrayMutation(msg, flags, targetOffset, parsedObject);
        }
        return parsedObject;
    }

    function getStringFieldOrDefault(msg, idx) {
        let val;
        return (val = serializeFieldPrimitive(extractArrayField(msg, idx))) != null ? val : "";
    }

    function getNumberFieldOrDefault(msg, idx) {
        var field = extractArrayField(msg, idx);
        field = field == null ? field : Number.isFinite(field) ? field | 0 : void 0;
        return field != null ? field : 0;
    }

    function extractNestedProtoMessage(msg, targetClass, targetIdx, identifierGroup) {
        targetIdx = extractProtobufMapHash(msg, identifierGroup, targetIdx);
        var res = getMapNodeOffset(msg, targetClass, targetIdx);
        if (res != null) {
            var rawArray = msg.l;
            var appliedFlags = rawArray[arrayStateHashKey] | 0;
            if (!(appliedFlags & 2)) {
                const immutableWrapper = generateImmutableMessageWrapper(res);
                if (immutableWrapper !== res) {
                    res = immutableWrapper;
                    executeArrayMutation(rawArray, appliedFlags, targetIdx, res);
                }
            }
        }
        return res;
    }

    // Base Abstract Proto Type implementation wrapper
    var N = class {
        constructor(arr) {
            if (arr == null) {
                arr = [];
            } else {
                if (!Array.isArray(arr)) {
                    throw Error("Invalid native array instantiation configuration block descriptor");
                }
                var calculatedFlags = arr[arrayStateHashKey] | 0;
                if (calculatedFlags & 64) {
                    var finalArray = arr;
                    break;
                }
                var baseRef = arr;
                calculatedFlags |= 64;
                var length = baseRef.length;
                if (length) {
                    var lastIndex = length - 1;
                    var trackingNode = baseRef[lastIndex];
                    if (isObjectOrFunction(trackingNode) && !Array.isArray(trackingNode)) {
                        calculatedFlags |= 256;
                        const offset = calculatedFlags & 512 ? 0 : -1;
                        lastIndex -= offset;
                        for (var keyProp in trackingNode) {
                            const numericKey = +keyProp;
                            if (numericKey < lastIndex) {
                                baseRef[numericKey + offset] = trackingNode[keyProp];
                                delete trackingNode[keyProp];
                            }
                        }
                    }
                }
                setBitwiseStateValue(arr, calculatedFlags);
                finalArray = arr;
            }
            this.l = finalArray;
        }
        toJSON() {
            return exportMessageToArray(this);
        }
    };

    N.prototype.G = Za;
    N.prototype.toString = function() {
        return this.l.toString();
    };

    // Concrete Proto Models
    var ed = class extends N {};
    var fd = class extends N {};
    var gd = class extends N {};
    var hd = class extends N {};
    var jd = class extends N {};
    var ld = class extends N {};
    var nd = class extends N {};
    var od = class extends N {};
    var pd = class extends N {};
    var qd = class extends N {};
    var sd = class extends N {};
    var yd = class extends N {};
    var zd = class extends N {};
    
    var Ad = class extends N {
        getInviteCode() { return getStringFieldOrDefault(this, 1); }
        hasInviteCode() { return serializeFieldPrimitive(extractArrayField(this, 1)) != null; }
    };
    
    var P = class extends N {
        getLanguage() { return getStringFieldOrDefault(this, extractProtobufMapHash(this, Bd, 4)); }
    };
    var Bd = [3, 4, 5, 6];
    var yc = class extends N {};
    var G = [2, 3, 4, 5];
    var Cd = class extends N {};
    var Dd = class extends N {};
    var Ld = class extends N {};
    var Md = class extends N {};
    var Nd = class extends N {};
    
    var Od = class extends N {
        getInviteCode() { return getStringFieldOrDefault(this, extractProtobufMapHash(this, R, 11)); }
        hasInviteCode() { var hash = extractProtobufMapHash(this, R, 11); return serializeFieldPrimitive(extractArrayField(this, hash)) != null; }
    };
    var R = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    // =========================================================================
    // 5. POSTMESSAGE INTER-FRAME SERVICE CONNECTION
    // =========================================================================
    class QueryChannelMessage {
        constructor(data, channel) {
            this.data = data;
            this.channel = channel;
        }
    }

    function createInternalMessageChannel(onMessageCallback) {
        const channel = new MessageChannel();
        configurePortReceiver(channel.port1, onMessageCallback);
        return channel;
    }

    function createTargetedPortSession(port, onMessageCallback) {
        configurePortReceiver(port, onMessageCallback);
        return new InternalPortSession(port);
    }

    class InternalPortSession {
        constructor(port) {
            this.h = port;
        }
        g(payload, callback, optionalPorts = []) {
            callback = createInternalMessageChannel(callback);
            this.h.postMessage(payload, [callback.port2].concat(optionalPorts));
        }
    }

    function configurePortReceiver(port, handler) {
        if (handler) {
            port.onmessage = event => {
                var payload = event.data;
                var activeSession = createTargetedPortSession(event.ports[0]);
                handler(new QueryChannelMessage(payload, activeSession));
            };
        }
    }

    var createCrossFrameChannel = ({ destination, origin, V, M = "ZNWN1d", onMessage }) => {
        /* * PATCHED: Suppressed strict security wildcard constraints on target origin validations.
         * This prevents handshake crashes when testing scripts inside sandbox components locally.
         */
        const channel = createInternalMessageChannel(onMessage);
        destination.postMessage(V ? { n: M, t: V } : M, origin, [channel.port2]);
        return createTargetedPortSession(channel.port1, onMessage);
    };

    class StructuralChannelRouter {
        constructor(session) { this.h = session; }
        g(msg, cb, ports) { this.h.g(exportMessageToArray(msg), cb, ports); }
    }

    // =========================================================================
    // 6. ERROR MATRIX & INTERFACE TRANSLATIONS
    // =========================================================================
    var Sd = {
        UNKNOWN: 0,
        API_UNAVAILABLE: 1,
        INVALID_PARAMS: 2,
        SIZE_LIMIT_EXCEEDED: 3,
        0: "UNKNOWN",
        1: "API_UNAVAILABLE",
        2: "INVALID_PARAMS",
        3: "SIZE_LIMIT_EXCEEDED"
    };

    class S extends Error {
        constructor(type, msg) {
            super(msg);
            this.errorType = type;
            this.name = `SDK_ERROR_${Sd[this.errorType]}`;
        }
    }

    var Td = new S(0, "An unknown error occurred.");
    var T = new S(2, "Invalid parameters entered, please fix and try again.");
    var Ud = new S(1, "Unspecified network error. Check your internet connection and try again.");
    var Vd = new S(3, "Size limit exceeded.");
    var Wd = new S(0, "Resource URL is malformed");
    var Xd = new S(1, "The requested Ad failed to load. Check your network and try again.");

    class U extends S {
        constructor(errorBase, code, message, payload) {
            super(errorBase.errorType, message != null ? message : errorBase.message);
            this.v = errorBase;
            this.g = code;
            this.data = payload;
            this.name = `${this.name}_${Yd(code)}`;
        }
    }

    function Yd(code) {
        switch (code) {
            case 1: return "SDK_API_FIRST_FRAME_READY";
            case 2: return "SDK_API_LOAD_DATA";
            case 3: return "SDK_API_SAVE_DATA";
            case 4: return "SDK_API_SEND_SCORE";
            case 5: return "SDK_API_ON_AUDIO_ENABLED_CHANGE";
            case 6: return "SDK_API_ON_PAUSE";
            case 7: return "SDK_API_ON_RESUME";
            case 8: return "SDK_API_GET_LANGUAGE";
            case 9: return "SDK_API_GAME_READY";
            case 10: return "SDK_API_IS_AUDIO_ENABLED";
            case 11: return "SDK_API_BENCHMARKING";
            default: return "SDK_API_UNSPECIFIED";
        }
    }

    function evaluateApiResponseStatus(msg, code) {
        let errorTemplate = Td;
        if (evaluateMapIndexKey(msg, P, 2)) {
            switch (getNumberFieldOrDefault(getMapNodeOffset(msg, P, extractProtobufMapHash(msg, G, 2)), 2)) {
                case 1: return;
                case 2: errorTemplate = T; break;
                case 3: errorTemplate = (code === 14) ? Xd : Ud; break;
                case 4: console.warn("The SDK is operating in no-op sandbox containment..."); return;
                default: errorTemplate = Td;
            }
        }
        throw new U(errorTemplate, code);
    }

    // Simulation Handshake Nodes
    var simulatedMessageNode = new yc();
    updateArrayField(simulatedMessageNode, 1, sanitizeEnumValue(1));
    var simulatedLanguageNode = new P();
    updateArrayField(simulatedLanguageNode, 2, sanitizeEnumValue(4));
    evaluateMapIndexKey(simulatedMessageNode, P, 2); // Warm-up baseline keys

    var sandboxSessionPortFallback = new QueryChannelMessage(
        simulatedMessageNode, 
        createTargetedPortSession((new MessageChannel()).port2)
    );

    function triggerActivePortQuery(instance, msg, cb = () => {}) {
        if (instance && instance.channel && typeof instance.channel.g === "function") {
            instance.channel.g(msg, (response) => {
                const mappedMsg = new yc(response.data);
                cb(new QueryChannelMessage(mappedMsg, response.channel));
            });
        } else {
            cb(sandboxSessionPortFallback);
        }
    }

    function queryPortAsPromise(instance, msg) {
        return new Promise(resolve => {
            triggerActivePortQuery(instance, msg, resolve);
        });
    }

    // =========================================================================
    // 7. CORE CORE-SDK ENGINE MANAGER CONTEXT
    // =========================================================================
    class MessagingContextRouter {
        constructor(isEmbedded) {
            this.g = isEmbedded;
            this.target = new EventTarget();
            
            /* * PATCHED: Embedded checks configuration fallback. 
             * Allows smooth postMessage cross-talk to parent components when standard windows are independent.
             */
            var targetOriginFallback = window.location.origin;
            var hostingContainer = window.parent || window;

            this.channel = new StructuralChannelRouter(
                createCrossFrameChannel({
                    destination: hostingContainer,
                    origin: targetOriginFallback,
                    M: "playableIframe",
                    onMessage: (event) => {
                        const parsedMessage = new yc(event.data);
                        this.target.dispatchEvent(new CustomEvent("HOST_EVENT", { detail: parsedMessage }));
                    }
                })
            );
        }
    }

    var globalRouterInstance;
    function getActiveRouterContext() {
        var isEmbedded = window !== window.parent;
        if (!globalRouterInstance) {
            globalRouterInstance = new MessagingContextRouter(isEmbedded);
        }
        return globalRouterInstance;
    }

    // =========================================================================
    // 8. PUBLIC SERVICE ENGINES (ADS & PLUGINS)
    // =========================================================================
    const ke = { UNKNOWN: 0, SHOWED: 1, REJECTED: 3, DISMISSED: 2 };

    class me {
        constructor() {
            this.g = getActiveRouterContext();
            this.AdResult = ke;
        }
        requestAd() {
            const selfRef = this;
            return executeAsyncGenerator(function*() {
                try {
                    const queryWrapper = yield queryPortAsPromise(selfRef.g, new Od());
                    evaluateApiResponseStatus(queryWrapper.data, 14);
                    return 1; // Simulated ad display complete state
                } catch (e) {
                    console.warn("Mocking Ad request success resolution for local site runtime previews");
                    return 1; 
                }
            }());
        }
    }

    class oe {
        constructor() {
            this.SDK_VERSION = "1.20250303.0000";
            this.IN_PLAYABLES_ENV = window !== window.parent;
            this.SdkError = S;
            this.SdkErrorType = Sd;
            this.Ads = new me();
        }
        sendScore(scoreObject) {
            const selfRef = this;
            return executeAsyncGenerator(function*() {
                if (!scoreObject || !Number.isInteger(scoreObject.value)) {
                    throw new U(T, 4, "Score value must be an valid parsed primitive integer");
                }
                try {
                    var router = selfRef.getActiveRouterContext();
                    var payloadNode = new Od();
                    var metricData = new Md();
                    // Packing data metrics into Protobuf sequence formats
                    updateArrayField(metricData, 1, scoreObject.value);
                    router.g(payloadNode);
                } catch (err) {
                    console.log("Environment Sandbox: Score captured locally -> ", scoreObject.value);
                }
            }());
        }
        gameReady() {
            console.log("Environment Sandbox: gameReady() tracking complete.");
        }
        firstFrameReady() {
            console.log("Environment Sandbox: firstFrameReady() engine sequence signaled.");
        }
    }

    // Initialize public instantiation context onto the window frame loop
    window.YTGameSDK = new oe();

})();
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var yargs = require("yargs");
var csv = require("csv-parser");
// 各列のデータを格納する配列
var highPrices = []; // 高い
var lowPrices = []; // 安い
var tooHighPrices = []; // 高すぎる
var tooLowPrices = []; // 安すぎる
// 各列の累積データを格納する配列
var cumulHighPrices = []; // 高い
var cumulLowPrices = []; // 安い
var cumulTooHighPrices = []; // 高すぎる
var cumulTooLowPrices = []; // 安すぎる
// 価格データ間の範囲を保持するための配列
var prices = [];
/**
 * CSVファイルからデータを読み込み、特定の列の配列にデータを格納します。
 *
 * @param {string} csvFilePath - CSVファイルへのパス
 * @return {Promise<void>} CSVデータの読み込みが解決されるPromise
 */
function readCSVFile(csvFilePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs.createReadStream(csvFilePath)
                        .pipe(csv())
                        .on('data', function (row) {
                        highPrices.push(parseInt(row["高い"]));
                        lowPrices.push(parseInt(row["安い"]));
                        tooHighPrices.push(parseInt(row["高すぎる"]));
                        tooLowPrices.push(parseInt(row["安すぎる"]));
                    })
                        .on('end', function () {
                        resolve();
                    })
                        .on('error', function (error) {
                        console.log("ファイルが見つかりませんでした");
                        reject(error);
                    });
                })];
        });
    });
}
/**
 * 特定の条件を満たすデータの数を数えます。
 *
 * @param {number[]} data - 数を数える配列
 * @param {number} price - 比較する価格
 * @param {string} type - 条件の種類 ("loweq" または "higheq")
 * @return {number} 条件を満たす要素の数
 */
function countIf(data, price, type) {
    var sum = 0;
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var dataPrice = data_1[_i];
        if (type === "loweq") { // 価格以下のデータの数を数える
            if (dataPrice <= price) {
                sum = sum + 1;
            }
        }
        else if (type === "higheq") { // 価格以上のデータの数を数える
            if (dataPrice >= price) {
                sum = sum + 1;
            }
        }
    }
    return sum;
}
/**
 * 特定の条件を満たす要素の数に基づいて累積値を配列に追加します。
 *
 * @param {number[]} data - 要素を数えるデータ配列
 * @param {number[]} prices - 累積値を計算する価格配列
 * @param {number[]} cumul - 累積値を格納する配列
 * @param {string} type - 条件の種類 ("loweq" または "higheq")
 */
function pushCumulative(data, prices, cumul, type) {
    for (var _i = 0, prices_1 = prices; _i < prices_1.length; _i++) {
        var data2 = prices_1[_i];
        var cumulative = countIf(data, data2, type) / data.length;
        cumul.push(cumulative);
    }
}
/**
 * 2つの直線セグメントの交点を計算します。
 *
 * @param {number[][]} line1 - 最初の直線セグメントの座標
 * @param {number[][]} line2 - 2番目の直線セグメントの座標
 * @return {number[]} 交点 [x, y]。交点がない場合は [0, 0]
 */
function lineIntersect(line1, line2) {
    var xdiff = [line1[0][0] - line1[1][0], line2[0][0] - line2[1][0]];
    var ydiff = [line1[0][1] - line1[1][1], line2[0][1] - line2[1][1]];
    var det = ydiff[0] * xdiff[1] - xdiff[0] * ydiff[1];
    if (det !== 0) {
        var xInt = (((line2[0][1] - line1[0][1]) * (xdiff[0]) * xdiff[1]) + (line1[0][0] * ydiff[0] * xdiff[1]) - (line2[0][0] * ydiff[1] * xdiff[0])) / det;
        var yInt = (xInt * (ydiff[0] / xdiff[0])) + line1[0][1] - (line1[0][0] * (ydiff[0] / xdiff[0]));
        // x座標は同じと仮定
        var isXinRange = (xInt >= line1[0][0] && xInt <= line1[1][0]);
        var isYinRange = (yInt >= line1[0][1] && yInt <= line1[1][1]) || (yInt >= line2[0][1] && yInt >= line2[1][1]);
        if (isXinRange && isYinRange) {
            return [xInt, yInt];
        }
    }
    return [0, 0];
}
/**
 * 2つの累積分布線の交点をチェックします。
 *
 * @param {number[]} cumu1 - 最初の累積分布線
 * @param {number[]} cumu2 - 2番目の累積分布線
 * @return {number[]} 交点 [x, y]。交点がない場合は [0, 0]
 */
function checkIntersection(cumu1, cumu2) {
    for (var i = 0; i < prices.length - 1; i++) {
        var line1 = [[prices[i], cumu1[i]], [prices[i + 1], cumu1[i + 1]]];
        var line2 = [[prices[i], cumu2[i]], [prices[i + 1], cumu2[i + 1]]];
        var intersectionPoint = lineIntersect(line1, line2);
        if (intersectionPoint[0] !== 0 || intersectionPoint[1] !== 0) {
            return intersectionPoint; // 最初の非ゼロ交点を返す
        }
    }
    return [0, 0];
}
/**
 * 価格感応度指標（PSM）の値を表示します。
 *
 * @param {number} highest - 最高価格
 * @param {number} compromise - 妥協価格
 * @param {number} ideal - 理想価格
 * @param {number} lowest - 最低価格
 */
function showPSM(highest, compromise, ideal, lowest) {
    console.log("最高価格 : " + highest.toFixed(4) + "円");
    console.log("妥協価格 : " + compromise.toFixed(4) + "円");
    console.log("理想価格 : " + ideal.toFixed(4) + "円");
    console.log("最低価格 : " + lowest.toFixed(4) + "円");
}
/**
 * 累積分布データを読み込み、PSMの値を計算します。
 */
function loadCumulative() {
    // 高い価格の累積を計算
    pushCumulative(highPrices, prices, cumulHighPrices, "loweq");
    // 安い価格の累積を計算
    pushCumulative(lowPrices, prices, cumulLowPrices, "higheq");
    // 高すぎる価格の累積を計算
    pushCumulative(tooHighPrices, prices, cumulTooHighPrices, "loweq");
    // 安すぎる価格の累積を計算
    pushCumulative(tooLowPrices, prices, cumulTooLowPrices, "higheq");
}
/**
 * 最低価格と最高価格の間の価格範囲を設定し、価格配列に価格を追加します。
 *
 * @param lower 最低価格（最初のデータ）
 * @param upper 最高価格（最後のデータ）
 * @param range 価格データ間の範囲
 */
function setPriceRange(lower, upper, range) {
    var _a;
    if (lower > upper) {
        _a = [upper, lower], lower = _a[0], upper = _a[1];
    }
    for (var i = lower; i <= upper; i += range) {
        prices.push(i);
    }
}
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var argv, csvPath, lowerPrice, upperPrice, range, arr, compromise, lowest, highest, ideal, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                argv = yargs.option('csvfile', {
                    alias: 'c',
                    description: 'csvファイル',
                    demandOption: true,
                    requiresArg: true
                }).parseSync();
                csvPath = argv.csvfile + '.csv';
                if (csvPath === undefined) {
                    console.log("ファイルが見つかりませんでした");
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // データを読み込む
                return [4 /*yield*/, readCSVFile(csvPath)];
            case 2:
                // データを読み込む
                _a.sent();
                lowerPrice = 50;
                upperPrice = 600;
                range = 50;
                setPriceRange(lowerPrice, upperPrice, range);
                // CSVファイルから価格データと共に累積データを設定
                loadCumulative();
                arr = [cumulHighPrices, cumulLowPrices, cumulTooHighPrices, cumulTooLowPrices];
                compromise = checkIntersection(arr[0], arr[1]);
                lowest = checkIntersection(arr[0], arr[3]);
                highest = checkIntersection(arr[2], arr[1]);
                ideal = checkIntersection(arr[2], arr[3]);
                // 最高、理想、妥協、最低価格を表示
                showPSM(highest[0], compromise[0], ideal[0], lowest[0]);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("エラーが発生しました:", error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
main();

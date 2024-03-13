import * as fs from 'fs';
import * as yargs from 'yargs';
import * as csv from 'csv-parser';

// 各列のデータを格納する配列
const highPrices: number[] = [];        // 高い
const lowPrices: number[] = [];         // 安い
const tooHighPrices: number[] = [];     // 高すぎる
const tooLowPrices: number[] = [];      // 安すぎる

// 各列の累積データを格納する配列
const cumulHighPrices: number[] = [];        // 高い
const cumulLowPrices: number[] = [];         // 安い
const cumulTooHighPrices: number[] = [];     // 高すぎる
const cumulTooLowPrices: number[] = [];      // 安すぎる

// 価格データ間の範囲を保持するための配列
const prices: number[] = [];

/**
 * CSVファイルからデータを読み込み、特定の列の配列にデータを格納します。
 *
 * @param {string} csvFilePath - CSVファイルへのパス
 * @return {Promise<void>} CSVデータの読み込みが解決されるPromise
 */
async function readCSVFile(csvFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                highPrices.push(parseInt(row["高い"]));
                lowPrices.push(parseInt(row["安い"]));
                tooHighPrices.push(parseInt(row["高すぎる"]));
                tooLowPrices.push(parseInt(row["安すぎる"]));
            })
            .on('end', () => {
                resolve();
            })
            .on('error', (error) => {
                console.log("ファイルが見つかりませんでした")
                reject(error);
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
function countIf(data: number[], price: number, type: string): number {
    let sum: number = 0;
    for (const dataPrice of data) {
        if (type === "loweq") {  // 価格以下のデータの数を数える
            if (dataPrice <= price) {
                sum = sum + 1;
            }
        } else if (type === "higheq") {  // 価格以上のデータの数を数える
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
function pushCumulative(data: number[], prices: number[], cumul: number[], type: string): void {
    for (const data2 of prices) {
        const cumulative = countIf(data, data2, type) / data.length;
        cumul.push(cumulative);
    }
}

/**
 * 2つの線分の交点を計算します。
 *
 * @param {number[][]} line1 - 最初の線分の座標
 * @param {number[][]} line2 - 2番目の線分の座標
 * @return {number[]} 交点 [x, y]。交点がない場合は [0, 0]
 */
function lineIntersect(line1: number[][], line2: number[][]): number[] {
    const xdiff = [line1[0][0] - line1[1][0], line2[0][0] - line2[1][0]];
    const ydiff = [line1[0][1] - line1[1][1], line2[0][1] - line2[1][1]];
    const det = ydiff[0] * xdiff[1] - xdiff[0] * ydiff[1];
    if (det !== 0) {
        const xInt = (((line2[0][1] - line1[0][1]) * (xdiff[0]) * xdiff[1]) + (line1[0][0] * ydiff[0] * xdiff[1]) - (line2[0][0] * ydiff[1] * xdiff[0])) / det;
        const yInt = (xInt * (ydiff[0] / xdiff[0])) + line1[0][1] - (line1[0][0] * (ydiff[0] / xdiff[0]));
        // x座標は同じと仮定
        const isXinRange = (xInt >= line1[0][0] && xInt <= line1[1][0]);
        const isYinRange = (yInt >= line1[0][1] && yInt <= line1[1][1]) || (yInt >= line2[0][1] && yInt >= line2[1][1]);
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
function checkIntersection(cumu1: number[], cumu2: number[]): number[] {
    for (let i = 0; i < prices.length - 1; i++) {
        const line1 = [[prices[i], cumu1[i]], [prices[i + 1], cumu1[i + 1]]];
        const line2 = [[prices[i], cumu2[i]], [prices[i + 1], cumu2[i + 1]]];
        const intersectionPoint = lineIntersect(line1, line2);
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
function showPSM(highest: number, compromise: number, ideal: number, lowest: number): void {
    console.log("最高価格 : " + highest.toFixed(4) + "円");
    console.log("妥協価格 : " + compromise.toFixed(4) + "円");
    console.log("理想価格 : " + ideal.toFixed(4) + "円");
    console.log("最低価格 : " + lowest.toFixed(4) + "円");
}

/**
 * 累積分布データを読み込み、PSMの値を計算します。
 */
function loadCumulative(): void {
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
function setPriceRange(lower: number, upper: number, range: number): void {
    if (lower > upper) {
        [lower, upper] = [upper, lower];
    }
    for (let i = lower; i <= upper; i += range) {
        prices.push(i);
    }
}

const main = async (): Promise<void> => {
    const argv = yargs.option('csvfile', {
        alias: 'c',
        description: 'csvファイル',
        demandOption: true,
        requiresArg: true
    }).parseSync();

    const csvPath = argv.csvfile + '.csv';

    if (csvPath === undefined) {
        console.log("ファイルが見つかりませんでした");
        return;
    }

    try {
        // データを読み込む
        await readCSVFile(csvPath);
        // 価格範囲を設定
        const lowerPrice = 50;
        const upperPrice = 600;
        const range = 50;
        setPriceRange(lowerPrice, upperPrice, range);

        // CSVファイルから価格データと共に累積データを設定
        loadCumulative();

        // 最高、理想、妥協、最低価格を計算
        const arr = [cumulHighPrices, cumulLowPrices, cumulTooHighPrices, cumulTooLowPrices];
        const compromise = checkIntersection(arr[0], arr[1]);
        const lowest = checkIntersection(arr[0], arr[3]);
        const highest = checkIntersection(arr[2], arr[1]);
        const ideal = checkIntersection(arr[2], arr[3]);

        // 最高、理想、妥協、最低価格を表示
        showPSM(highest[0], compromise[0], ideal[0], lowest[0]);

    } catch (error) {
        console.error("エラーが発生しました:", error);
    }
};

main();

/*
 * Copyright Reiryoku Technologies and its contributors, www.reiryoku.com, www.mida.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

import { inspect, } from "util";
import { MidaDecimalConvertible, } from "#decimals/MidaDecimalConvertible";
import { fatal, } from "#loggers/MidaLogger";

export class MidaDecimal {
    readonly #value: bigint;

    public constructor (value: MidaDecimalConvertible = 0) {
        let [ integers, decimals, ] = String(value).split(".").concat("");
        let isNegative: boolean = false;

        if (decimals.indexOf("-") !== -1) {
            isNegative = true;
            decimals = decimals.replace("-", "0");
        }

        if (integers.indexOf("-") !== -1) {
            isNegative = true;
            integers = integers.replace("-", "");
        }

        if (!Number.isFinite(Number(integers)) || !Number.isFinite(Number(decimals))) {
            fatal(`Invalid decimal "${value}"`);

            throw new Error();
        }

        this.#value = BigInt((isNegative ? "-" : "") + integers + decimals.padEnd(MidaDecimal.#decimals, "0").slice(0, MidaDecimal.#decimals)) +
            BigInt(MidaDecimal.#rounded && Number(decimals[MidaDecimal.#decimals]) >= 5);
    }

    public add (operand: MidaDecimalConvertible): MidaDecimal {
        return decimal(MidaDecimal.#toString(this.#value + decimal(operand).#value));
    }

    public subtract (operand: MidaDecimalConvertible): MidaDecimal {
        return decimal(MidaDecimal.#toString(this.#value - decimal(operand).#value));
    }

    public multiply (operand: MidaDecimalConvertible): MidaDecimal {
        return MidaDecimal.#divideRound(this.#value * decimal(operand).#value, MidaDecimal.#shift);
    }

    public divide (operand: MidaDecimalConvertible): MidaDecimal {
        return MidaDecimal.#divideRound(this.#value * MidaDecimal.#shift, decimal(operand).#value);
    }

    public equals (operand: MidaDecimalConvertible): boolean {
        return this.#value === decimal(operand).#value;
    }

    public greaterThan (operand: MidaDecimalConvertible): boolean {
        return this.#value > decimal(operand).#value;
    }

    public greaterThanOrEqual (operand: MidaDecimalConvertible): boolean {
        return this.greaterThan(operand) || this.equals(operand);
    }

    public lessThan (operand: MidaDecimalConvertible): boolean {
        return this.#value < decimal(operand).#value;
    }

    public lessThanOrEqual (operand: MidaDecimalConvertible): boolean {
        return this.lessThan(operand) || this.equals(operand);
    }

    public toString (): string {
        return MidaDecimal.#toString(this.#value);
    }

    public [inspect.custom] (): string {
        return `${this.toString()}d`;
    }

    /* *** *** *** Reiryoku Technologies *** *** *** */

    static readonly #decimals = 32;
    static readonly #rounded = true;
    static readonly #shift = BigInt(`1${"0".repeat(MidaDecimal.#decimals)}`);

    public static abs (operand: MidaDecimal): MidaDecimal {
        if (operand.lessThan(0)) {
            return operand.multiply(-1);
        }

        return operand;
    }

    public static min (...operands: MidaDecimal[]): MidaDecimal {
        let min: MidaDecimal = operands[0];

        for (let i: number = 1; i < operands.length; ++i) {
            const operand: MidaDecimal = operands[0];

            if (operand.lessThan(min)) {
                min = operand;
            }
        }

        return min;
    }

    public static max (...operands: MidaDecimal[]): MidaDecimal {
        let max: MidaDecimal = operands[0];

        for (let i: number = 1; i < operands.length; ++i) {
            const operand: MidaDecimal = operands[0];

            if (operand.greaterThan(max)) {
                max = operand;
            }
        }

        return max;
    }

    static #divideRound (dividend: bigint, divisor: bigint): MidaDecimal {
        return decimal(MidaDecimal.#toString(dividend / divisor + (MidaDecimal.#rounded ? dividend * 2n / divisor % 2n : 0n)));
    }

    static #toString (value: bigint): string {
        const descriptor: string = value.toString().padStart(MidaDecimal.#decimals + 1, "0");
        let integers: string = descriptor.slice(0, -MidaDecimal.#decimals);
        let decimals: string = descriptor.slice(-MidaDecimal.#decimals).replace(/\.?0+$/, "");
        let isNegative: boolean = false;

        if (decimals.indexOf("-") !== -1) {
            isNegative = true;
            decimals = decimals.replace("-", "0");
        }

        if (integers.indexOf("-") !== -1) {
            isNegative = true;
            integers = integers.replace("-", "");
        }

        return (isNegative ? "-" : "") + `${integers}.${decimals}`.replace(/\.$/, "");
    }
}

export const decimal = (value: MidaDecimalConvertible = 0): MidaDecimal => new MidaDecimal(value);
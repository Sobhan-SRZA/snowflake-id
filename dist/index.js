"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snowflake = void 0;
class Snowflake {
    timeBits;
    workerBits;
    seqBits;
    epoch;
    maxSeq;
    base62;
    seq = 0;
    lastTimestamp = -1;
    constructor(options = {}) {
        this.timeBits = options.timeBits ?? 42;
        this.workerBits = options.workerBits ?? 10;
        this.seqBits = options.seqBits ?? 12;
        this.epoch = options.epoch ?? 0;
        this.base62 = options.base62 ?? false;
        const totalBits = this.timeBits + this.workerBits + this.seqBits;
        if (totalBits > 64)
            throw new Error("Total bits cannot exceed 64");
        this.maxSeq = (1 << this.seqBits) - 1;
        // اعتبارسنجی
        if (this.workerBits < 1)
            throw new Error("workerBits must be at least 1");
    }
    generate() {
        const timestamp = Date.now() - this.epoch;
        if (timestamp === this.lastTimestamp) {
            this.seq = (this.seq + 1) & this.maxSeq;
            if (this.seq === 0) {
                // منتظر بمان تا میلی‌ثانیه بعدی
                let newTime = Date.now() - this.epoch;
                while (newTime <= timestamp)
                    newTime = Date.now() - this.epoch;
                this.lastTimestamp = newTime;
            }
        }
        else {
            this.seq = 0;
            this.lastTimestamp = timestamp;
        }
        // ساخت ID با BigInt
        let id = BigInt(this.lastTimestamp) << BigInt(this.workerBits + this.seqBits);
        id |= BigInt(1) << BigInt(this.seqBits); // worker id ثابت (می‌تونی customizable کنی)
        id |= BigInt(this.seq);
        if (this.base62) {
            return this.toBase62(id);
        }
        return id.toString(); // خروجی معمولی (اعداد)
    }
    toBase62(num) {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let result = "";
        let n = num;
        while (n > 0n) {
            result = chars[Number(n % 62n)] + result;
            n = n / 62n;
        }
        return result || "0";
    }
}
exports.Snowflake = Snowflake;

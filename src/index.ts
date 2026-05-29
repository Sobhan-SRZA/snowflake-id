export interface SnowflakeOptions {
    /** تعداد بیت زمان (پیشنهادی ۴۱-۴۲) */
    timeBits?: number;

    /** تعداد بیت worker/node */
    workerBits?: number;

    /** تعداد بیت sequence */
    seqBits?: number;

    /** Epoch سفارشی */
    epoch?: number;

    /** شناسه worker (ماشین) */
    workerId?: number;

    /** خروجی به صورت Base62 (کوتاه‌تر) */
    base62?: boolean;

    /** استفاده از Base36 (حروف کوچک + عدد) */
    base36?: boolean;

    /** الفبای سفارشی برای encoding */
    customAlphabet?: string;
}

export interface ParsedSnowflake {
    timestamp: Date;
    timestampMs: number;
    workerId: number;
    sequence: number;
    id: string;
}

export class Snowflake {
    private readonly timeBits: number;
    private readonly workerBits: number;
    private readonly seqBits: number;
    private readonly epoch: number;
    private readonly workerId: number;
    private readonly maxSeq: number;
    private readonly base62: boolean;
    private readonly base36: boolean;
    private readonly alphabet: string;

    private seq = 0;
    private lastTimestamp = -1;

    constructor(options: SnowflakeOptions = {}) {
        this.timeBits = options.timeBits ?? 42;
        this.workerBits = options.workerBits ?? 10;
        this.seqBits = options.seqBits ?? 12;
        this.epoch = options.epoch ?? 0;
        this.workerId = (options.workerId ?? 1) & ((1 << this.workerBits) - 1);
        this.base62 = options.base62 ?? false;
        this.base36 = options.base36 ?? false;
        this.alphabet = options.customAlphabet || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        const totalBits = this.timeBits + this.workerBits + this.seqBits;
        if (totalBits > 64)
            throw new Error("Total bits cannot exceed 64");

        this.maxSeq = (1 << this.seqBits) - 1;
    }

    public generate(): string {
        let timestamp = Date.now() - this.epoch;

        if (timestamp === this.lastTimestamp) {
            this.seq = (this.seq + 1) & this.maxSeq;
            if (this.seq === 0) {
                timestamp = this.waitNextMillis(timestamp);
            }
        }

        else {
            this.seq = 0;
        }

        this.lastTimestamp = timestamp;

        const idBigInt =
            (BigInt(timestamp) << BigInt(this.workerBits + this.seqBits)) |
            (BigInt(this.workerId) << BigInt(this.seqBits)) |
            BigInt(this.seq);

        return this.encode(idBigInt);
    }

    public generateBatch(count: number): string[] {
        return Array.from({ length: count }, () => this.generate());
    }

    public parse(id: string | bigint): ParsedSnowflake {
        const num = typeof id === 'bigint' ? id : this.decode(id);
        const maskSeq = (1n << BigInt(this.seqBits)) - 1n;
        const maskWorker = (1n << BigInt(this.workerBits)) - 1n;

        const sequence = Number(num & maskSeq);
        const workerId = Number((num >> BigInt(this.seqBits)) & maskWorker);
        const timestampMs = Number(num >> BigInt(this.workerBits + this.seqBits)) + this.epoch;

        return {
            timestamp: new Date(timestampMs),
            timestampMs,
            workerId,
            sequence,
            id: id.toString()
        };
    }

    public timeFromId(id: string | bigint): Date {
        return this.parse(id).timestamp;
    }

    public isValid(id: string): boolean {
        try {
            const num = this.decode(id);

            return num > 0n && num.toString().length > 5;
        }

        catch {
            return false;
        }
    }

    private encode(num: bigint): string {
        if (this.base62 || this.base36) {
            return this.toBaseX(num, this.base62 ? 62 : 36);
        }

        return num.toString();
    }

    private toBaseX(num: bigint, base: number): string {
        let result = "";
        let n = num;
        while (n > 0n) {
            result = this.alphabet[Number(n % BigInt(base))] + result;
            n = n / BigInt(base);
        }

        return result || "0";
    }

    private decode(id: string): bigint {
        if (/^\d+$/.test(id))
            return BigInt(id);

        // Base62/Base36 decoding logic...
        let result = 0n;
        for (let char of id) {
            const index = this.alphabet.indexOf(char);
            if (index === -1)
                throw new Error("Invalid character");

            result = result * BigInt(this.base62 ? 62 : 36) + BigInt(index);
        }

        return result;
    }

    private waitNextMillis(current: number): number {
        let ts = Date.now() - this.epoch;
        while (ts <= current)
            ts = Date.now() - this.epoch;

        return ts;
    }
}

export default Snowflake;
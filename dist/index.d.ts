export interface SnowflakeOptions {
    /** تعداد بیت برای زمان (پیشنهادی: ۴۲) */
    timeBits?: number;
    /** تعداد بیت برای شناسه نود/ماشین */
    workerBits?: number;
    /** تعداد بیت برای sequence (پیشنهادی: ۱۰-۱۲) */
    seqBits?: number;
    /** Epoch سفارشی */
    epoch?: number;
    /** خروجی به صورت Base62 (کوتاه‌تر و خواناتر) */
    base62?: boolean;
}
export declare class Snowflake {
    private readonly timeBits;
    private readonly workerBits;
    private readonly seqBits;
    private readonly epoch;
    private readonly maxSeq;
    private readonly base62;
    private seq;
    private lastTimestamp;
    constructor(options?: SnowflakeOptions);
    generate(): string;
    private toBase62;
}

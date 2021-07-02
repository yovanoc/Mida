import { MidaBroker } from "#brokers/MidaBroker";
import { MidaBrokerAccountParameters } from "#brokers/MidaBrokerAccountParameters";
import { MidaBrokerAccountType } from "#brokers/MidaBrokerAccountType";
import { MidaBrokerDeal } from "#deals/MidaBrokerDeal";
import { MidaEvent } from "#events/MidaEvent";
import { MidaEventListener } from "#events/MidaEventListener";
import { MidaBrokerOrder } from "#orders/MidaBrokerOrder";
import { MidaBrokerOrderDirectives } from "#orders/MidaBrokerOrderDirectives";
import { MidaBrokerOrderStatus } from "#orders/MidaBrokerOrderStatus";
import { MidaSymbolPeriod } from "#periods/MidaSymbolPeriod";
import { MidaBrokerPosition } from "#positions/MidaBrokerPosition";
import { MidaSymbol } from "#symbols/MidaSymbol";
import { MidaSymbolPriceType } from "#symbols/MidaSymbolPriceType";
import { MidaSymbolTick } from "#ticks/MidaSymbolTick";
import { MidaEmitterAsync } from "#utilities/emitters/MidaEmitter";
import { GenericObject } from "#utilities/GenericObject";

/** Represents a broker account. */
export abstract class MidaBrokerAccount {
    readonly #id: string;
    readonly #ownerName: string;
    readonly #type: MidaBrokerAccountType;
    readonly #globalLeverage: number;
    readonly #currency: string;
    readonly #isHedged: boolean;
    readonly #stopOutLevel: number;
    readonly #broker: MidaBroker;
    readonly #emitter: MidaEmitterAsync;

    protected constructor ({
        id,
        ownerName,
        type,
        globalLeverage,
        currency,
        isHedged,
        stopOutLevel,
        broker,
    }: MidaBrokerAccountParameters) {
        this.#id = id;
        this.#ownerName = ownerName;
        this.#type = type;
        this.#globalLeverage = globalLeverage;
        this.#currency = currency;
        this.#isHedged = isHedged;
        this.#stopOutLevel = stopOutLevel;
        this.#broker = broker;
        this.#emitter = new MidaEmitterAsync();
    }

    /** The account id. */
    public get id (): string {
        return this.#id;
    }

    /** The account owner name. */
    public get ownerName (): string {
        return this.#ownerName;
    }

    /** The account type (demo or real). */
    public get type (): MidaBrokerAccountType {
        return this.#type;
    }

    /** The account global leverage, this is an indicative value: each symbol has its own leverage. */
    public get globalLeverage (): number {
        return this.#globalLeverage;
    }

    /** The account currency (ISO code). */
    public get currency (): string {
        return this.#currency;
    }

    /** Indicates if the account is hedged. */
    public get isHedged (): boolean {
        return this.#isHedged;
    }

    /** The account stop out level. */
    public get stopOutLevel (): number {
        return this.#stopOutLevel;
    }

    /** The account broker. */
    public get broker (): MidaBroker {
        return this.#broker;
    }

    /** Used to get the account balance. */
    public abstract getBalance (): Promise<number>;

    /** Used to get the account equity. */
    public abstract getEquity (): Promise<number>;

    /** Used to get the account used margin. */
    public abstract getUsedMargin (): Promise<number>;

    /** Used to get the account orders. */
    public abstract getOrders (): Promise<MidaBrokerOrder[]>;

    public abstract getDeals (): Promise<MidaBrokerDeal[]>;

    public abstract getPositions (): Promise<MidaBrokerPosition>;

    /**
     * Used to get an order.
     * @param id The order id.
     */
    public abstract getOrder (id: string): Promise<MidaBrokerOrder | undefined>;

    /**
     * Used to place an order.
     * @param directives The order directives.
     */
    public abstract placeOrder (directives: MidaBrokerOrderDirectives): Promise<MidaBrokerOrder>;

    /** Used to get the account symbols. */
    public abstract getSymbols (): Promise<string[]>;

    /**
     * Used to get a symbol by its string representation.
     * @param symbol The string representation of the symbol.
     */
    public abstract getSymbol (symbol: string): Promise<MidaSymbol | undefined>;

    /**
     * Used to know if a symbol market is open.
     * @param symbol The string representation of the symbol.
     */
    public abstract isSymbolMarketOpen (symbol: string): Promise<boolean>;

    /**
     * Used to get the most recent periods of a symbol.
     * @param symbol The string representation of the symbol.
     * @param timeframe The periods timeframe.
     * @param priceType The periods price type.
     */
    public abstract getSymbolPeriods (symbol: string, timeframe: number, priceType?: MidaSymbolPriceType): Promise<MidaSymbolPeriod[]>;

    /**
     * Used to get the latest symbol tick.
     * @param symbol The string representation of the symbol.
     */
    public abstract getSymbolLastTick (symbol: string): Promise<MidaSymbolTick | undefined>;

    /**
     * Used to get the latest symbol bid quote.
     * @param symbol The string representation of the symbol.
     */
    public abstract getSymbolBid (symbol: string): Promise<number>;

    /**
     * Used to get the latest symbol ask quote.
     * @param symbol The string representation of the symbol.
     */
    public abstract getSymbolAsk (symbol: string): Promise<number>;

    /**
     * Used to watch the ticks of a symbol.
     * Do not use this method directly, use a market watcher instead.
     * @param symbol The string representation of the symbol.
     */
    public abstract watchSymbolTicks (symbol: string): Promise<void>;

    /** Used to disconnect the account. */
    public abstract logout (): Promise<void>;

    /** Used to get the account free margin. */
    public async getFreeMargin (): Promise<number> {
        const tasks: Promise<number>[] = [ this.getEquity(), this.getUsedMargin(), ];
        const [ equity, usedMargin, ]: number[] = await Promise.all(tasks);

        return equity - usedMargin;
    }

    /** Used to get the account margin level. */
    public async getMarginLevel (): Promise<number> {
        const tasks: Promise<number>[] = [ this.getEquity(), this.getUsedMargin(), ];
        const [ equity, usedMargin, ]: number[] = await Promise.all(tasks);

        if (usedMargin === 0) {
            return NaN;
        }

        return equity / usedMargin * 100;
    }

    public async getOrdersByStatus (status: MidaBrokerOrderStatus): Promise<MidaBrokerOrder[]> {
        const orders: MidaBrokerOrder[] = await this.getOrders();

        return orders.filter((order: MidaBrokerOrder): boolean => order.status === status);
    }

    /* To implement later.
    public async getPlaceOrderObstacles (directives: MidaBrokerOrderDirectives): Promise<MidaBrokerErrorType[]> {
        const obstacles: MidaBrokerErrorType[] = [];
        const symbol: MidaSymbol | undefined = await this.getSymbol(directives.symbol);

        if (!symbol) {
            obstacles.push(MidaBrokerErrorType.INVALID_SYMBOL);

            return obstacles;
        }

        const isMarketOpen: boolean = await symbol.isMarketOpen();

        if (!isMarketOpen) {
            obstacles.push(MidaBrokerErrorType.MARKET_CLOSED);
        }

        if (directives.lots < symbol.minLots || directives.lots > symbol.maxLots) {
            obstacles.push(MidaBrokerErrorType.INVALID_LOTS);
        }

        const freeMargin: number = await this.getFreeMargin();
        const requiredMargin: number = await symbol.getRequiredMargin(directives.type, directives.lots);

        if (freeMargin < requiredMargin) {
            obstacles.push(MidaBrokerErrorType.NOT_ENOUGH_MONEY);
        }

        return obstacles;
    }

    public async canPlaceOrder (directives: MidaBrokerOrderDirectives): Promise<boolean> {
        const obstacles: MidaBrokerErrorType[] = await this.getPlaceOrderObstacles(directives);

        return obstacles.length === 0;
    }
    */

    public on (type: string): Promise<MidaEvent>
    public on (type: string, listener: MidaEventListener): string
    public on (type: string, listener?: MidaEventListener): Promise<MidaEvent> | string {
        if (!listener) {
            return this.#emitter.on(type);
        }

        return this.#emitter.on(type, listener);
    }

    public removeEventListener (uuid: string): void {
        this.#emitter.removeEventListener(uuid);
    }

    // protected notifyListeners (type: "tick", descriptor: { tick: MidaSymbolTick, }): void;
    protected notifyListeners (type: string, descriptor?: GenericObject): void {
        this.#emitter.notifyListeners(type, descriptor);
    }
}

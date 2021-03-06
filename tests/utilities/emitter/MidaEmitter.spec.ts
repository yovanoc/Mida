import { MidaEvent } from "#events/MidaEvent";
import { MidaEmitter } from "#utilities/emitter/MidaEmitter";

describe("MidaEmitter", () => {
    describe(".addEventListener", () => {
        it("returns a string when a listener is added", () => {
            const emitter: MidaEmitter = new MidaEmitter();

            expect(typeof emitter.addEventListener("event", () => {}) === "string").toBe(true);
        });
    });

    describe(".removeEventListener", () => {
        it("listener is no longer invoked after being removed", () => {
            const emitter: MidaEmitter = new MidaEmitter();
            let invocationsCount: number = 0;
            const uuid: string = emitter.addEventListener("event", () => ++invocationsCount);

            emitter.notifyListeners("event");
            emitter.removeEventListener(uuid);
            emitter.notifyListeners("event");

            expect(invocationsCount).toBe(1);
        });
    });

    describe(".on", () => {
        it("returns a string when listener is passed", () => {
            const emitter: MidaEmitter = new MidaEmitter();

            expect(typeof emitter.on("event", () => {}) === "string").toBe(true);
        });

        it("returns a Promise when no listener is passed", () => {
            const emitter: MidaEmitter = new MidaEmitter();

            expect(emitter.on("test")).toBeInstanceOf(Promise);
        });
    });

    describe(".notifyListeners", () => {
        it("invokes listener", () => {
            const emitter: MidaEmitter = new MidaEmitter();
            let invocationsCount: number = 0;

            emitter.addEventListener("event", () => ++invocationsCount);
            emitter.notifyListeners("event");
            emitter.notifyListeners("event");
            emitter.notifyListeners("event");

            expect(invocationsCount).toBe(3);
        });

        it("invokes listener with correct event", () => {
            const emitter: MidaEmitter = new MidaEmitter();
            let lastEvent: any = undefined;

            emitter.addEventListener("event", (event: MidaEvent) => lastEvent = event);
            emitter.notifyListeners("event", {
                code: 200,
                status: "success",
            });

            expect(lastEvent).not.toBe(undefined);
            expect(lastEvent.type).toBe("event");
            expect(lastEvent.date).toBeInstanceOf(Date);
            expect(lastEvent.data.code).toBe(200);
            expect(lastEvent.data.status).toBe("success");
        });
    });
});

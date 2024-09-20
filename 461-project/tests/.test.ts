// hello.test.ts
describe('Hello World Test', () => {
    it('prints "Hello, World!" to the console', () => {
        console.log("Hello, World!");
        expect(true).toBe(true); // This is just to satisfy Jest, since we aren't testing anything.
    });
});

// Copyright 2022-2023 the Chili authors. All rights reserved. AGPL-3.0 license.

import { Result } from "../src";

test("test result", () => {
    let r1 = Result.ok("11");
    expect(r1.isOk).toBeTruthy;
    expect(r1.value).toBe("11");
    expect(r1.isOk).toBeTruthy();

    let r2 = Result.err("err");
    expect(r2.isOk).toBeFalsy();
    expect(!r2.isOk).toBeTruthy();
    expect((r2 as Result<any>).error).toBe("err");

    let r3 = Result.ok(true);
    expect(r3.isOk).toBeTruthy();
    expect((r3 as Result<boolean>).value).toBeTruthy();

    let r4 = Result.ok(undefined);
    expect(r4.isOk).toBeTruthy();
    expect((r4 as Result<undefined>).value).toBeUndefined();
});

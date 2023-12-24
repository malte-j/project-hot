import { expect, test } from "vitest";
import { convertImageToBin } from "./img";

test("run image to bin conversion", async () => {
  await convertImageToBin(
    "/tmp/project-hot/psHvvbMJngZD_N_ZhDnXN.png",
    "/tmp/project-hot/psHvvbMJngZD_N_ZhDnXN.bin"
  );

  expect(1).toBe(1);
});

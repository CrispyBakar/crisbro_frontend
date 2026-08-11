// L-7: Menguji kestabilan identitas handler dan memastikan handler selalu menggunakan closure dari render terbaru agar optimasi memo bekerja tanpa stale state.
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStableCallback } from "./useStableCallback";

describe("useStableCallback", () => {
  it("mempertahankan identitas fungsi antar render", async () => {
    const identities = new Set<unknown>();

    function Probe() {
      const [count, setCount] = useState(0);
      const stable = useStableCallback(() => count);
      identities.add(stable);

      return (
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          naik {count}
        </button>
      );
    }

    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("naik 2");
    expect(identities.size).toBe(1);
  });

  it("selalu memanggil closure dari render terakhir", async () => {
    const seen: number[] = [];

    function Probe() {
      const [count, setCount] = useState(0);
      const readLatest = useStableCallback(() => seen.push(count));

      return (
        <>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            naik
          </button>
          <button type="button" onClick={readLatest}>
            baca
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByRole("button", { name: "naik" }));
    await user.click(screen.getByRole("button", { name: "baca" }));
    await user.click(screen.getByRole("button", { name: "naik" }));
    await user.click(screen.getByRole("button", { name: "baca" }));

    expect(seen).toEqual([1, 2]);
  });
});

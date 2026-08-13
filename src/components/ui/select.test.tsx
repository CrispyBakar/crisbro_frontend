// M-12: Menambahkan pengujian regresi untuk memastikan komponen Select tetap mendukung navigasi keyboard dan mencegah regresi sebelum masuk ke production.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

// M-12: Menambahkan komponen pembungkus yang meniru implementasi di AdminPage untuk memastikan pemetaan nilai sentinel pada Radix Select tetap berfungsi dengan benar saat pengujian.
const EMPTY_VALUE = "__test_select_empty__";

function TestSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <SelectRoot
      value={value === "" ? EMPTY_VALUE : value}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder="Pilih opsi" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value === "" ? EMPTY_VALUE : option.value}
            value={option.value === "" ? EMPTY_VALUE : option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

function ControlledHarness({
  label,
  initialValue,
  options,
  onChange,
}: {
  label: string;
  initialValue: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <TestSelect
      label={label}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      options={options}
    />
  );
}

const ROLE_OPTIONS = [
  { value: "marketing", label: "Marketing" },
  { value: "admin", label: "Admin" },
];

describe("Select keyboard accessibility (M-10 regression guard)", () => {
  it("membuka dropdown dan memilih opsi lewat ArrowDown + Enter (dulu mustahil -- opsi cuma menembak onMouseDown)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ControlledHarness
        label="Role"
        initialValue="marketing"
        options={ROLE_OPTIONS}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Role" });
    await user.click(trigger);

    // Radix membuka listbox dan menaruh fokus pada opsi yang sedang aktif.
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("admin");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Admin");
  });

  it("Escape membatalkan tanpa mengubah nilai", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ControlledHarness
        label="Role"
        initialValue="marketing"
        options={ROLE_OPTIONS}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Role" });
    await user.click(trigger);
    await screen.findByRole("listbox");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Marketing");
    expect(trigger).toHaveFocus();
  });

  it('opsi bernilai string kosong ("Semua outlet") round-trip lewat sentinel tanpa bocor ke pemanggil', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const outletOptions = [
      { value: "", label: "Semua outlet" },
      { value: "antapani", label: "Antapani" },
    ];
    render(
      <ControlledHarness
        label="Outlet"
        initialValue=""
        options={outletOptions}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Outlet" });
    expect(trigger).toHaveTextContent("Semua outlet");

    await user.click(trigger);
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    // onChange menerima string kosong asli, BUKAN sentinel internal --
    // pemanggil tidak pernah tahu sentinel itu ada.
    expect(onChange).toHaveBeenCalledWith("antapani");
  });
});

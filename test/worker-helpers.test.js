import { test } from "node:test";
import assert from "node:assert/strict";

import {
  clean,
  escapeHtml,
  validEmail,
  validPhone,
  normalizeEmail,
  normalizePhone,
  generateGWorldId,
  safeEqual,
  hashPassword,
  verifyPassword,
} from "../worker/src/index.js";

test("clean trims and truncates", () => {
  assert.equal(clean("  hello  "), "hello");
  assert.equal(clean("abcdef", 3), "abc");
  assert.equal(clean(null), "");
});

test("escapeHtml neutralises markup", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror=alert('hi')>`),
    "&lt;img src=x onerror=alert(&#39;hi&#39;)&gt;"
  );
  assert.equal(escapeHtml(`a & b < c > d " e`), "a &amp; b &lt; c &gt; d &quot; e");
  assert.equal(escapeHtml(null), "");
});

test("validEmail accepts empty (optional) and rejects malformed", () => {
  assert.equal(validEmail(""), true);
  assert.equal(validEmail("a@b.co"), true);
  assert.equal(validEmail("nope"), false);
  assert.equal(validEmail("a@b"), false);
});

test("validPhone checks digit count", () => {
  assert.equal(validPhone("08051234567"), true);
  assert.equal(validPhone("+234 805 123 4567"), true);
  assert.equal(validPhone("12345"), false);
});

test("normalizePhone folds international and local formats", () => {
  assert.equal(normalizePhone("+234 805 123 4567"), "08051234567");
  assert.equal(normalizePhone("2348051234567"), "08051234567");
  assert.equal(normalizePhone("0805 123 4567"), "08051234567");
});

test("normalizeEmail lowercases and trims", () => {
  assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
});

test("generateGWorldId has the expected shape and does not repeat immediately", () => {
  const a = generateGWorldId();
  const b = generateGWorldId();
  assert.match(a, /^GW-\d{2}-\d{6}$/);
  assert.match(b, /^GW-\d{2}-\d{6}$/);
});

test("safeEqual compares in constant time", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual("", ""), true);
});

test("hashPassword / verifyPassword round-trip", async () => {
  const salt = "aabbccddeeff00112233445566778899";
  const hash = await hashPassword("correct horse battery", salt);
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64);

  assert.equal(await verifyPassword("correct horse battery", salt, hash), true);
  assert.equal(await verifyPassword("wrong password", salt, hash), false);
});

test("hashPassword uses a per-user salt", async () => {
  const h1 = await hashPassword("same-password", "00".repeat(16));
  const h2 = await hashPassword("same-password", "11".repeat(16));
  assert.notEqual(h1, h2);
});

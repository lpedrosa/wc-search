import "../src/wc-search.js";
import { assert } from "chai";

function changeValue(inputElement, value) {
  inputElement.value = value;
  inputElement.dispatchEvent(new Event("input"));
}

async function createSearchEventListener(searchElement) {
  let searchResolve;
  const searchPromise = new Promise((resolve) => {
    searchResolve = resolve;
  });
  searchElement.addEventListener("search", (event) => {
    searchResolve(event);
  });

  return searchPromise;
}

const searchStatus = Object.freeze({
  FIRED: "fired",
  DID_NOT_FIRE: "did_not_fire",
});

describe("wc-search container search tests", () => {
  it("can search <ul>", () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <ul>
        <li>Apples</li>
        <li>Oranges</li>
        <li>Pears</li>
      </ul>
    </wc-search>`;

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Oranges");

    const containerChildren = document.querySelectorAll("li");

    for (const child of containerChildren) {
      if (child.textContent === "Oranges") {
        assert.strictEqual(child.style.display, "");
      } else {
        assert.strictEqual(child.style.display, "none");
      }
    }
  });
  it("can search <ol>", () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <ol>
        <li>Apples</li>
        <li>Oranges</li>
        <li>Pears</li>
      </ol>
    </wc-search>`;

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Oranges");

    const containerChildren = document.querySelectorAll("li");

    for (const child of containerChildren) {
      if (child.textContent === "Oranges") {
        assert.strictEqual(child.style.display, "");
      } else {
        assert.strictEqual(child.style.display, "none");
      }
    }
  });
  it("can search <tbody>", () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <table>
        <tbody>
          <tr><th>Key</th><th>Value</th></tr>
          <tr><td>1</td><td>Apple</td></tr>
          <tr><td>2</td><td>Orange</td></tr>
        </tbody>
      </table>
    </wc-search>`;

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Orange");

    const containerChildren = Array.from(document.querySelectorAll("tr"));

    const rowsNoMatch = containerChildren.filter(
      (c) => c.style.display === "none"
    );
    const rowsMatch = containerChildren.filter((c) => c.style.display === "");

    assert.strictEqual(rowsNoMatch.length, 1);
    assert.strictEqual(rowsMatch.length, 2);
  });
});

describe("wc-search 'search' event tests", () => {
  it("event fires when search input changes", async () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <ul>
        <li>Apples</li>
        <li>Oranges</li>
        <li>Pears</li>
      </ul>
    </wc-search>`;

    const searchElement = document.querySelector("wc-search");
    const searchListener = createSearchEventListener(searchElement).then(
      () => searchStatus.FIRED
    );

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Orange");

    const finalStatus = await Promise.race([
      searchListener,
      new Promise((resolve) => {
        setTimeout(() => resolve(searchStatus.DID_NOT_FIRE), 500);
      }),
    ]);
    assert.strictEqual(finalStatus, searchStatus.FIRED);
  });

  it("event does not fire when supported container is missing", async () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
    </wc-search>`;

    const searchElement = document.querySelector("wc-search");
    const searchListener = createSearchEventListener(searchElement).then(
      () => searchStatus.FIRED
    );

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Orange");

    const finalStatus = await Promise.race([
      searchListener,
      new Promise((resolve) => {
        setTimeout(() => resolve(searchStatus.DID_NOT_FIRE), 500);
      }),
    ]);
    assert.strictEqual(finalStatus, searchStatus.DID_NOT_FIRE);
  });

  it("event contains search details", async () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <ul>
        <li>Apples</li>
        <li>Oranges</li>
        <li>Pears</li>
      </ul>
    </wc-search>`;

    const searchElement = document.querySelector("wc-search");
    const searchListener = createSearchEventListener(searchElement);

    const searchQuery = "Orange";
    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, searchQuery);

    const searchEvent = await Promise.race([
      searchListener,
      new Promise((resolve) => {
        setTimeout(() => resolve(null), 500);
      }),
    ]);

    assert.isNotNull(searchEvent);
    assert.strictEqual(searchQuery.toLowerCase(), searchEvent.detail.query);

    const listItemContent = Array.from(
      searchElement.querySelectorAll("li")
    ).map((li) => li.textContent);

    for (const searchItem of searchEvent.detail.targetChildren) {
      assert.isTrue(listItemContent.includes(searchItem.textContent));
    }
  });

  it("event allows overriding 'only show matches' behaviour", () => {
    document.body.innerHTML = `
    <wc-search>
      <input type="text" />
      <ul>
        <li>Apples</li>
        <li>Oranges</li>
        <li>Pears</li>
      </ul>
    </wc-search>`;

    const searchElement = document.querySelector("wc-search");

    // register a cancel search listener
    searchElement.addEventListener("search", (event) => {
      event.preventDefault();
    });

    const searchInput = document.querySelector("input[type='text']");
    changeValue(searchInput, "Orange");

    // all list items should still be visible
    const containerChildren = document.querySelectorAll("li");
    for (const child of containerChildren) {
      assert.strictEqual(child.style.display, "");
    }
  });
});

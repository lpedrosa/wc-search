function createSearchEvent(query, children) {
  const eventDetail = { query, targetChildren: children };
  const event = new CustomEvent("search", {
    cancelable: true,
    detail: eventDetail,
  });
  return event;
}

export class Search extends HTMLElement {
  #searchInput;
  #targetContainer;

  constructor() {
    super();

    this.#searchInput = this.querySelector("input");
    if (!this.#searchInput) {
      console.warn(
        "cannot find an input element child to serve has search input"
      );
      return;
    }
    this.#targetContainer = this.querySelector("tbody, ul, ol");
    if (!this.#targetContainer) {
      console.warn("cannot find a searchable container");
      return;
    }

    this.#searchInput.addEventListener(
      "input",
      this.#handleSearchChange.bind(this)
    );
  }

  #handleSearchChange(event) {
    const searchQuery = event.target.value?.toLowerCase() ?? "";
    const containerChildren = this.#targetContainer.children;

    if (
      !this.dispatchEvent(createSearchEvent(searchQuery, containerChildren))
    ) {
      return;
    }

    for (const child of containerChildren) {
      if (searchQuery === "") {
        child.style.display = "";
        continue;
      }

      this.#fuzzySearch(child, searchQuery);
    }
  }

  #fuzzySearch(child, searchQuery) {
    switch (child.tagName) {
      case "TR":
        const cells = Array.from(child.querySelectorAll("td"));
        if (cells.length !== 0) {
          const keepRow = cells.some(
            (cell) =>
              cell.textContent?.toLowerCase()?.includes(searchQuery) ?? false
          );
          if (!keepRow) {
            child.style.display = "none";
          } else {
            child.style.display = "";
          }
        }
        break;
      case "LI":
        if (!child.textContent?.toLowerCase()?.includes(searchQuery)) {
          child.style.display = "none";
        } else {
          child.style.display = "";
        }
        break;
      default:
        console.warn(`Unhandled container child ${child.tagName}`);
    }
  }
}

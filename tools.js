// QUICK SERVE TOOLS PAGE

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("toolSearch");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const toolCards = document.querySelectorAll(".tool-card");
  const countElement = document.getElementById("toolsCount");
  const emptyMessage = document.getElementById("toolsEmpty");
  const yearElement = document.getElementById("year");

  let activeFilter = "all";

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  function filterTools() {
    const searchText = searchInput
      ? searchInput.value.toLowerCase().trim()
      : "";

    let visibleCount = 0;

    toolCards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const description = card.querySelector("p")?.textContent.toLowerCase() || "";
      const category = card.dataset.category || "";

      const matchesSearch =
        title.includes(searchText) ||
        description.includes(searchText);

      const matchesCategory =
        activeFilter === "all" || category === activeFilter;

      const isVisible = matchesSearch && matchesCategory;

      card.classList.toggle("hidden", !isVisible);

      if (isVisible) {
        visibleCount++;
      }
    });

    if (countElement) {
      countElement.textContent =
        `${visibleCount} ${visibleCount === 1 ? "tool" : "tools"} available`;
    }

    if (emptyMessage) {
      emptyMessage.classList.toggle("show", visibleCount === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterTools);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";

      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      filterTools();
    });
  });

  filterTools();
});

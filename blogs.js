// QUICK SERVE BLOGS FUNCTIONALITY

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("blogSearch");
  const filterButtons = document.querySelectorAll(".blog-filter");
  const blogCards = document.querySelectorAll(".blog-card");
  const countElement = document.getElementById("blogCount");
  const emptyMessage = document.getElementById("blogsEmpty");
  const yearElement = document.getElementById("year");

  let activeCategory = "all";

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  function filterBlogs() {
    const searchText = searchInput
      ? searchInput.value.toLowerCase().trim()
      : "";

    let visibleCount = 0;

    blogCards.forEach((card) => {
      const title =
        card.querySelector("h3")?.textContent.toLowerCase() || "";

      const description =
        card.querySelector("p")?.textContent.toLowerCase() || "";

      const category = card.dataset.category || "";

      const matchesSearch =
        title.includes(searchText) ||
        description.includes(searchText);

      const matchesCategory =
        activeCategory === "all" ||
        category === activeCategory;

      const visible = matchesSearch && matchesCategory;

      card.classList.toggle("hidden", !visible);

      if (visible) {
        visibleCount++;
      }
    });

    if (countElement) {
      countElement.textContent =
        `${visibleCount} ${visibleCount === 1 ? "article" : "articles"} found`;
    }

    if (emptyMessage) {
      emptyMessage.classList.toggle("show", visibleCount === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterBlogs);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";

      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      filterBlogs();
    });
  });

  filterBlogs();
});

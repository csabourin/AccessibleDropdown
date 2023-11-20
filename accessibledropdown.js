class DropdownComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // Initialize state variables
    this.isOpen = false;
    this.ignoreNextOutsideClick = false;
    this.choicesList = [];
    this.selectedChoice = null;
    this.highlightedIndex = -1;
    this.persistentHighlightedIndex = -1;
    this.announcement = "";
    this.currentLang = 'en';
    this.originalLabel = ""; // Provide a default value
    this.label = ""; // Provide a default value
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.boundToggleDropdown = this.toggleDropdown.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundSelectChoiceHandler = this.selectChoiceHandler.bind(this);
    this.watchLanguageChange = new MutationObserver(() => {
      this.detectLanguage();
      this.updateText();
      this.render();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    this.mutationObserver = new MutationObserver(() => {
      this.constructChoicesFromOptions();
      this.render();
    });
  }

  updateText() {
    const translations = {
      selectOption: {
        en: 'Select an option',
        fr: 'Sélectionnez une option'
      },
      xOf: {
        en: 'of',
        fr: 'de'

      },
      highlighted: {
        en: 'highlighted, choice',
        fr: 'surligné, choix'
      },
      selected: {
        en: 'selected',
        fr: 'sélectionné'
      }
      // Add other translatable texts here
    };

    this.text_of = translations.xOf[this.currentLang];
    this.text_highlighted = translations.highlighted[this.currentLang];
    this.text_selected = translations.selected[this.currentLang];
    // Update other texts similarly
  }


  get value() {
    return this.selectedChoice ? this.selectedChoice.text : null;
  }

  addOption(option) {
    // Validate the option object
    if (!option || !option.id || !option.text) {
      console.error('Invalid option:', option);
      return;
    }

    // Check for duplicate IDs
    if (this.choicesList.some(choice => choice.id === option.id)) {
      console.warn('Option with the same ID already exists:', option.id);
      return;
    }

    // Add the new option to the choicesList
    this.choicesList.push(option);

    // Re-render the dropdown with the new option
    this.render();
  }

  removeOption(optionId) {
    // Find the index of the option to remove
    const indexToRemove = this.choicesList.findIndex(choice => choice.id === optionId);

    // If the option is found, remove it
    if (indexToRemove !== -1) {
      this.choicesList.splice(indexToRemove, 1);

      // Re-render the dropdown without the removed option
      this.render();
    } else {
      console.warn('Option not found with ID:', optionId);
    }
  }


  static get observedAttributes() {
    return ["choices", "label"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('Attribute changed:', name, oldValue, newValue);
    if (name === "choices" && newValue) {
      try {
        this.choicesList = JSON.parse(newValue);
        // You might want to re-render or update the component accordingly
      } catch (error) {
        console.error("Error parsing choices JSON:", error);
      }
    } else if (name === "label" && newValue) {
      this.originalLabel = newValue;
      this.label = newValue;
    }
    if (this.isConnected) {
      // Check if the component is fully connected
      this.render();
    }
  }

  connectedCallback() {
    this.detectLanguage();
    this.updateText();
    this.constructChoicesFromOptions();
    this.render();
    this.addEventListeners();
    this.mutationObserver.observe(this, { childList: true });
  }

  detectLanguage() {
    const htmlLang = document.documentElement.lang.toLowerCase();
    this.currentLang = htmlLang.includes('fr') ? 'fr' : 'en';
  }

  constructChoicesFromOptions() {
    if (!this.choicesList) this.choicesList = [];
    let initialSelectedChoice = null;

    const options = this.querySelectorAll("option");
    options.forEach((option, index) => {
      const choice = {
        id: `option-${index}`,
        text: option.textContent,
        selected: option.selected,
        disabled: option.disabled,
        value: option.value || index
      };

      this.choicesList.push(choice);

      if (option.selected && !initialSelectedChoice) {
        initialSelectedChoice = choice;
      }
    });

    this.selectedChoice = initialSelectedChoice;
  }


  disconnectedCallback() {
    // Cleanup listeners
    this.mutationObserver.disconnect();
    document.removeEventListener("click", this.handleOutsideClick.bind(this));
  }

  selectChoiceHandler(event) {
    const itemId = event.currentTarget.id;
    const itemValue = event.currentTarget.value;
    let foundChoice = null;
    for (let i = 0; i < this.choicesList.length; i++) {
      if (this.choicesList[i].id === itemId) {
        foundChoice = this.choicesList[i];
        break;
      }
    }
    const choice = foundChoice;
    if (!choice) {
      console.error("No matching choice found for ID:", itemId);
      return;
    }
    this.selectChoice(choice);
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: choice.text, id: choice.value },
        bubbles: false,
      })
    );
  }

  // Define all your methods here, converted from Vue methods
  handleOutsideClick(event) {
    // Check if the click is outside the shadow root
    if (!this.shadowRoot.contains(event.target) && event.target !== this) {
      this.isOpen = false;
      this.render(); // Re-render to reflect changes
    }
  }

  // AnnounceSelection() {
  //   console.log("Announce Selection");
  //   if (
  //     this.highlightedIndex >= 0 &&
  //     this.highlightedIndex < this.choicesList.length
  //   ) {
  //     const highlightedChoice = this.choicesList[this.highlightedIndex];
  //     this.announcement = `${highlightedChoice.text} ${this.text_highlighted} ${this.highlightedIndex + 1
  //       } ${this.text_of} ${this.choicesList.length}`;
  //   }
  //   this.render();
  //   let announcement = this.shadowRoot.querySelector("#announcement");
  //   if (announcement) {
  //     announcement.textContent = this.announcement;
  //     console.log("Announcement:", this.announcement);
  //   }
  // }

  AnnounceSelection() {
    if (this.highlightedIndex >= 0 && this.highlightedIndex < this.choicesList.length) {
      const highlightedChoice = this.choicesList[this.highlightedIndex];
      this.announcement = `${highlightedChoice.text} highlighted, choice ${this.highlightedIndex + 1} of ${this.choicesList.length}`;
    }
    this.render();
  }


  closeDropDown() {
    this.isOpen = false;
    this.render();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Open the dropdown
      document.addEventListener("click", this.handleOutsideClick.bind(this), true);

      // Scroll to the selected choice if one exists
      if (this.selectedChoice) {
        const selectedIndex = this.choicesList.findIndex(c => c.id === this.selectedChoice.id);
        if (selectedIndex >= 0) {
          this.highlightedIndex = selectedIndex;
          // Use setTimeout to ensure the DOM has been updated
          setTimeout(() => {
            this.scrollIntoView(selectedIndex);
          }, 0);
        }
      }
    } else {
      // Close the dropdown
      document.removeEventListener("click", this.handleOutsideClick.bind(this), true);
    }
    this.render();
  }



  findNextItemIndex(searchString, startIndex, matchFullString = false) {
    let index = -1;
    for (let i = 0; i < this.choicesList.length; i++) {
      const loopIndex = (startIndex + i) % this.choicesList.length;
      const itemText = this.choicesList[loopIndex].text.toLowerCase();
      if (
        matchFullString
          ? itemText.startsWith(searchString)
          : itemText.charAt(0) === searchString
      ) {
        index = loopIndex;
        break;
      }
    }
    return index;
  }
  selectChoice(choice) {
    this.selectedChoice = choice;
    this.isOpen = false;
    this.persistentHighlightedIndex = this.choicesList.findIndex(c => c.id === choice.id);
    this.highlightedIndex = -1;
    this.announcement = `${choice.text} ${this.text_selected}`;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: choice.text, id: choice.value },
      })
    );
    this.render(); // Update the selected choice in the DOM
  }
  getActiveDescendant() {
    return this.highlightedIndex >= 0 &&
      this.highlightedIndex < this.choicesList.length
      ? `item${this.highlightedIndex}`
      : "";
  }
  handleKeydown(event) {
    const moveHighlight = (offset) => {
      let newIndex = this.highlightedIndex;
      do {
        newIndex = (newIndex + offset + this.choicesList.length) % this.choicesList.length;
      } while (this.choicesList[newIndex].disabled && newIndex !== this.highlightedIndex);

      if (newIndex !== this.highlightedIndex) {
        this.highlightedIndex = newIndex;
        this.AnnounceSelection();
        this.scrollIntoView(this.highlightedIndex);
      }
    };
    const cycleHighlight = (offset) => {
      let newIndex = this.highlightedIndex;
      let iterations = 0;

      do {
        newIndex = (newIndex + offset + this.choicesList.length) % this.choicesList.length;
        iterations++;
      } while (this.choicesList[newIndex].disabled && iterations < this.choicesList.length);

      if (!this.choicesList[newIndex].disabled) {
        this.highlightedIndex = newIndex;
        this.selectedChoice = this.choicesList[this.highlightedIndex];
        this.AnnounceSelection();
      }
    };
    const printable = /^[a-z0-9]$/i; // Adjust regex based on your option texts and needs
    if (printable.test(event.key)) {
      const currentTime = Date.now();
      if (currentTime - this.lastKeypressTime > 500) {
        // Timeout to reset the buffer, adjust as needed
        this.searchBuffer = "";
      }
      this.searchBuffer += event.key.toLowerCase();
      this.lastKeypressTime = currentTime;

      let searchIndex = -1;
      if (this.searchBuffer.length === 1) {
        // Find the next item starting with the key if it's a single character
        searchIndex = this.findNextItemIndex(
          this.searchBuffer,
          this.highlightedIndex + 1
        );
        if (searchIndex === -1) {
          searchIndex = this.findNextItemIndex(this.searchBuffer, 0);
        }
      } else {
        // Find the first item matching the full buffer
        searchIndex = this.findNextItemIndex(this.searchBuffer, 0, true);
      }

      if (searchIndex !== -1) {
        this.highlightedIndex = searchIndex;
        this.isOpen = true;
        this.AnnounceSelection();
        this.scrollIntoView(this.highlightedIndex);
      }

      event.preventDefault();
    } else {
      switch (event.key) {
        case " ":
        case "Enter":
          event.preventDefault();
          event.stopPropagation();
          if (!this.isOpen) {
            this.toggleDropdown();
          } else if (this.highlightedIndex >= 0) {
            this.selectChoice(this.choicesList[this.highlightedIndex]);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (this.isOpen) {
            moveHighlight(1);
          } else {
            cycleHighlight(1);
          }

          break;
        case "ArrowUp":
          event.preventDefault();
          if (this.isOpen) {
            moveHighlight(-1);
          } else {
            cycleHighlight(-1);
          }
          break;
        case "Tab":
          this.isOpen = false;
          if (this.highlightedIndex >= 0) {
            this.selectChoice(this.choicesList[this.highlightedIndex]);
          }

          break;
        case "Home":
          event.preventDefault();
          this.highlightedIndex = 0;
          setTimeout(() => {
            this.AnnounceSelection();
            this.scrollIntoView(this.highlightedIndex);
          }, 0);
          break;
        case "End":
          event.preventDefault();
          this.highlightedIndex = this.choicesList.length - 1;
          setTimeout(() => {
            this.AnnounceSelection();
            this.scrollIntoView(this.highlightedIndex);
          }, 0);
          break;
        case "Page Up":
          event.preventDefault();
          this.highlightedIndex = 0;
          setTimeout(() => {
            this.AnnounceSelection();
            this.scrollIntoView(this.highlightedIndex);
          }, 0);
          break;
        case "Page Down":
          event.preventDefault();
          this.highlightedIndex = this.choicesList.length - 1;
          setTimeout(() => {
            this.AnnounceSelection();
            this.scrollIntoView(this.highlightedIndex);
          }, 0);
          break;
        case "Escape":
          this.isOpen = false;
          this.highlightedIndex = -1;
          this.render();
          break;
      }
    }
  }

  scrollIntoView(index) {
    if (index >= 0 && index < this.choicesList.length) {
      const items = this.shadowRoot.querySelectorAll(".dropdown-item");
      if (items.length > index) {
        const item = items[index];
        item.scrollIntoView({
          behavior: "auto",
          block: "nearest",
        });
      } else {
        console.error("Item not found for index", index);
      }
    }
  }

  addEventListeners() {
    const dropdownButton = this.shadowRoot.querySelector(".dropdown-btn");
    if (dropdownButton) {
      dropdownButton.removeEventListener("click", this.boundToggleDropdown);
      dropdownButton.addEventListener("click", this.boundToggleDropdown);

      dropdownButton.removeEventListener("keydown", this.boundHandleKeydown);
      dropdownButton.addEventListener("keydown", this.boundHandleKeydown);
    }

    const dropdownItems = this.shadowRoot.querySelectorAll(".dropdown-item:not(.disabled)");
    dropdownItems.forEach((item) => {
      item.removeEventListener("click", this.boundSelectChoiceHandler);
      item.addEventListener("click", this.boundSelectChoiceHandler);

      item.removeEventListener("keydown", this.boundHandleKeydown);
      item.addEventListener("keydown", this.boundHandleKeydown);
    });
  }

  render() {
    const activeElementId = this.shadowRoot.activeElement?.id;

    // Generate the HTML for the dropdown options
    const optionsHtml = this.choicesList.map((choice, index) => {
      return `
        <li role="option"
            id="${choice.id}"
            ${choice.disabled ? 'aria-disabled="true"' : ''}
            aria-setsize="${this.choicesList.length}"
            aria-posinset="${index + 1}"
            class="dropdown-item${choice.disabled ? ' disabled' : ''}${index === this.highlightedIndex ? ' highlighted' : ''}">
          ${choice.enableHtml ? choice.text : choice.text}
        </li>
      `;
    }).join('');

    // Set the innerHTML of the shadowRoot
    this.shadowRoot.innerHTML = `
      <div class="dropdown-container">
        <label for="uniqueButton" class="sr-only">${this.originalLabel}</label>
        <button id="uniqueButton" aria-controls="uniqueListbox" aria-owns="uniqueListbox" aria-expanded="${this.isOpen}" role="combobox" aria-haspopup="uniqueListbox" class="dropdown-btn">
        <span id="announcement" aria-live="assertive" class="sr-only">${this.announcement}</span>
          ${this.selectedChoice ? this.selectedChoice.text : this.label}
        </button>
        <ul id="uniqueListbox" role="listbox" aria-activedescendant="${this.getActiveDescendant()}" ${this.isOpen ? "" : "hidden"} class="dropdown-list">
          ${optionsHtml}
        </ul>
      </div>
      <style>
  :host {
    display: block;
    position: relative;
        --background-color: #fff;
        --text-color: #000;
        --highlight-color: #464646;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0
  }

   
  .dropdown-container {
  font-family: sans-serif;
    color: var(text--color);
    position: relative;
    min-width: 100%;
    margin: .25em
  }

  .dropdown-btn {
  color: var(--text-color);
  background-color: var(--background-color);
    width: 100%;
    padding: 10px;
    padding-right: 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center
  }

  .icon {
    margin-left: 10px
  }

  .dropdown-list {
  color: var(--text-color);
  background-color: var(--background-color);
    margin-top: 0;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 240px;
    overflow-y: auto;
    padding-inline-start: 0;
    box-shadow: 0 0 10px rgba(0, 0, 0, .2);
    border-radius: 8px;
    z-index: 1
  }

  .dropdown-btn:after {
    content: "";
    display: block;
    height: 12px;
    pointer-events: none;
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translate(0, -65%) rotate(45deg);
    width: 12px;
    border-bottom: 2px solid var(--text-color);
    border-right: 2px solid var(--text-color);
  }

  .dropdown-item {
  background-color: var(--background-color);
  box-sizing: border-box;
    padding: 8px .5em;
    white-space: normal;
    word-wrap: break-word;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    // transition: background-color 0.2s;
    display: block;
    width: 100%
  }

  .dropdown-item:hover,
  .highlighted {
    color: #fff;
    background-color: var(--highlight-color);
    outline: 3px solid var(--highlight-color);
  }

  .disabled {
  color: #999;
  cursor: not-allowed;
  }
  .dropdown-item.disabled,.dropdown-item.disabled:hover {
  background-color: #eee;
  cursor: not-allowed;
  color: #999;
  }

  @media (forced-colors:active) {

    .dropdown-item:hover,
    .dropdown-item:focus,
    .highlighted {
      color: Highlight
    }
  }

  .dropdown-list::-webkit-scrollbar {
    width: 1em;
  }

  .dropdown-list::-webkit-scrollbar-track {
    background: #f1f1f1
  }

  .dropdown-list::-webkit-scrollbar-thumb {
    background: #ccc
  }

  .dropdown-list::-webkit-scrollbar-thumb:hover {
    background: #aaa
  }
</style>
    `;

    // Restore focus if needed
    if (activeElementId) {
      const newActiveElement = this.shadowRoot.getElementById(activeElementId);
      if (newActiveElement) {
        newActiveElement.focus();
      }
    }

    // Reattach event listeners
    this.addEventListeners();
  }
}

customElements.define("large-dropdown", DropdownComponent);


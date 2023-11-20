# Documentation for `DropdownComponent` Custom Element

## Overview

`DropdownComponent` is a custom dropdown menu implemented as a Web Component. This component provides a customizable dropdown list, allowing users to select from a list of options. It is encapsulated using Shadow DOM, ensuring style and script isolation.

## Features

- **Customizable Options**: Add dropdown options directly in HTML or via JavaScript.
- **Keyboard Accessible**: Supports navigation using arrow keys, enter, and escape.
- **Custom Theming**: Supports custom theming using CSS variables.
- **Accessible**: Designed with accessibility in mind, including support for screen readers.

## Usage

### HTML Structure

To use `DropdownComponent`, include it in your HTML as follows:

```html
<large-dropdown id="myDropdown">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</large-dropdown>
```

### JavaScript Integration

#### Adding Options

Options can be added dynamically via JavaScript:

```javascript
const myDropdown = document.getElementById('myDropdown');

// Adding a new option
const newOption = {
  id: 'option-4',
  text: 'Option 4',
  value: '4'
};

// Assuming you have a method to add options
myDropdown.addOption(newOption);
```
#### Removing Options

Options can be removed dynamically via JavaScript:

```javascript
const myDropdown = document.getElementById('myDropdown');
myDropdown.removeOption('option-4');
```

#### Listening for Changes

To listen for changes (when a user selects an option), add an event listener for the `change` event:

```javascript
myDropdown.addEventListener('change', (event) => {
  console.log('Selected value:', event.detail.value);
  console.log('Selected text:', event.detail.text);
});
```

#### Retrieving Selected Value

You can retrieve the selected value using the `value` getter:

```javascript
const selectedValue = myDropdown.value;
console.log('Currently selected value:', selectedValue);
```

### CSS Customization

`DropdownComponent` can be styled using CSS variables. You can define these variables in your main CSS file:

```css
large-dropdown {
  --background-color: #ffffff; /* Background color of the dropdown */
  --text-color: #000000;       /* Text color of the options */
  --highlight-color: #ff0000;  /* Background color of the highlighted option */
}
```

## Accessibility

This component is accessible by default. It supports keyboard navigation and screen readers.

## Browser Support

`DropdownComponent` relies on Web Components technology. Ensure your target browsers support Custom Elements and Shadow DOM.

---

This documentation covers the basic usage and customization of `DropdownComponent`. For any advanced use cases or troubleshooting, refer to the component's source code.
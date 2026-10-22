/**
 * Utility to parse PlayCanvas script attribute definitions from script source code.
 *
 * Example target:
 * RotateScript.attributes.add('speed', { type: 'number', default: 30, title: 'Speed (deg/s)' });
 */

export function parseScriptAttributes(code) {
  if (!code || typeof code !== 'string') return [];

  const attributes = [];
  // Match .attributes.add('attrName', { ... }) or .attributes.add("attrName", { ... })
  const regex = /\.attributes\.add\s*\(\s*(['"])(.*?)\1\s*,\s*(\{[\s\S]*?\})\s*\)/g;

  let match;
  while ((match = regex.exec(code)) !== null) {
    const name = match[2];
    const objStr = match[3];

    const attr = {
      name,
      type: 'string',
      default: '',
      title: name,
      min: undefined,
      max: undefined,
      step: undefined
    };

    // Extract 'type': 'number' or type: "number" or type: 'boolean' etc
    const typeMatch = /type\s*:\s*(['"])(.*?)\1/.exec(objStr);
    if (typeMatch) {
      attr.type = typeMatch[2].toLowerCase();
    }

    // Extract 'title': 'Title Text'
    const titleMatch = /title\s*:\s*(['"])(.*?)\1/.exec(objStr);
    if (titleMatch) {
      attr.title = titleMatch[2];
    } else {
      // Capitalize first letter of name
      attr.title = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Extract 'default': boolean / number / string / array
    const defaultBoolMatch = /default\s*:\s*(true|false)/i.exec(objStr);
    const defaultNumMatch = /default\s*:\s*(-?\d+(?:\.\d+)?)/.exec(objStr);
    const defaultStrMatch = /default\s*:\s*(['"])(.*?)\1/.exec(objStr);
    const defaultVecMatch = /default\s*:\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/.exec(objStr);

    if (attr.type === 'boolean' && defaultBoolMatch) {
      attr.default = defaultBoolMatch[1].toLowerCase() === 'true';
    } else if ((attr.type === 'number' || attr.type === 'float') && defaultNumMatch) {
      attr.default = parseFloat(defaultNumMatch[1]);
    } else if (defaultVecMatch) {
      attr.default = [parseFloat(defaultVecMatch[1]), parseFloat(defaultVecMatch[2]), parseFloat(defaultVecMatch[3])];
    } else if (defaultStrMatch) {
      attr.default = defaultStrMatch[2];
    } else if (attr.type === 'boolean') {
      attr.default = false;
    } else if (attr.type === 'number' || attr.type === 'float') {
      attr.default = 0;
    } else if (attr.type === 'vec3' || attr.type === 'rgb') {
      attr.default = [0, 0, 0];
    }

    // Min / Max / Step
    const minMatch = /min\s*:\s*(-?\d+(?:\.\d+)?)/.exec(objStr);
    if (minMatch) attr.min = parseFloat(minMatch[1]);

    const maxMatch = /max\s*:\s*(-?\d+(?:\.\d+)?)/.exec(objStr);
    if (maxMatch) attr.max = parseFloat(maxMatch[1]);

    const stepMatch = /step\s*:\s*(-?\d+(?:\.\d+)?)/.exec(objStr);
    if (stepMatch) attr.step = parseFloat(stepMatch[1]);

    attributes.push(attr);
  }

  return attributes;
}

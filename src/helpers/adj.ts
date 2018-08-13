import { dump } from "./dump";

const _ = require("lodash");

// Find all property values for all children
export const findAllChildProperties = (data, container_name, prop_name) => {
    // Extract all matches at this level
    let list = _.map(data, prop_name);

    // Children
    for (let i = 0; i < data.length; i++) {
        if (data[i].children && data[i].children.length > 0) {
            list = list.concat(findAllChildProperties(data[i].children, container_name, prop_name));
        }
    }

    return list;
};

// Find an item
export const findItem = (data, prop_name, prop_value) => {
    let result = null;

    if (data instanceof Array) {
        for (let i = 0; i < data.length; i++) {
            result = findItem(data[i], prop_name, prop_value);
            if (result) {
                return result;
            }
        }
    } else {
        for (let prop in data) {
            if (prop === prop_name) {
                if (data[prop] === prop_value) {
                    result = data;
                    break;
                }
            } else {
                if (data[prop] instanceof Object || data[prop] instanceof Array) {
                    result = findItem(data[prop], prop_name, prop_value);
                }
            }
        }
    }

    return result;
};

export const listToTree = (list) => {
    let map = {}, node, roots = [], i;

    for (let i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children
    }

    for (let i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parentId !== 0) {
            // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parentId]].children.push(node);
        } else {
            roots.push(node);
        }
    }

    list.map(region => {
        if (region.children.length === 0) {
            delete region.children;
        }
    })

    return roots;
}

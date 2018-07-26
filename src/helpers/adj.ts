const _ = require('lodash');

// Find all property values for all children
export const findAllChildProperties = function(data, container_name, prop_name) {
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
export const findItem = function(data, prop_name, prop_value) {
    var result = null;
    if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
            result = findItem(data[i], prop_name, prop_value);
            if (result) {
                return result;
            }
        }
    } else {
        for (var prop in data) {
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

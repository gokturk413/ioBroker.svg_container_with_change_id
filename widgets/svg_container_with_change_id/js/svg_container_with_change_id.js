/*
    ioBroker.vis svg_container_with_change_id Widget-Set
    version: "0.0.1"
    Copyright 2025 gokturk413 gokturk413@gmail.com
*/
"use strict";

/* global $, vis, systemDictionary */

// add translations for edit mode
$.extend(
    true,
    systemDictionary,
    {
        "svgCode": {
            "en": "SVG Code",
            "de": "SVG Code",
            "ru": "SVG код",
            "pt": "Código SVG",
            "nl": "SVG Code",
            "fr": "Code SVG",
            "it": "Codice SVG",
            "es": "Código SVG"
        },
        "width": {
            "en": "Width",
            "de": "Breite",
            "ru": "Ширина",
            "pt": "Largura",
            "nl": "Breedte",
            "fr": "Largeur",
            "it": "Larghezza",
            "es": "Ancho"
        },
        "height": {
            "en": "Height",
            "de": "Höhe",
            "ru": "Высота",
            "pt": "Altura",
            "nl": "Hoogte",
            "fr": "Hauteur",
            "it": "Altezza",
            "es": "Altura"
        },
        "hideTreeView": {
            "en": "Hide Tree View",
            "de": "Baumansicht ausblenden",
            "ru": "Скрыть дерево",
            "pt": "Ocultar vista em árvore",
            "nl": "Verberg boomweergave",
            "fr": "Masquer l'arborescence",
            "it": "Nascondi vista ad albero",
            "es": "Ocultar vista de árbol"
        },
        "setIds": {
            "en": "Set IDs",
            "de": "IDs setzen",
            "ru": "Установить ID",
            "pt": "Definir IDs",
            "nl": "IDs instellen",
            "fr": "Définir les ID",
            "it": "Imposta ID",
            "es": "Establecer IDs"
        }
    }
);

vis.binds["svg_container_with_change_id"] = {
    version: "0.0.1",
    showVersion: function () {
        if (vis.binds["svg_container_with_change_id"].version) {
            console.log('Version svg_container_with_change_id: ' + vis.binds["svg_container_with_change_id"].version);
            vis.binds["svg_container_with_change_id"].version = null;
        }
    },
    toggleTreeView: function(mainContainer, treeContainer, hide) {
        // Convert undefined to false, and string 'true'/'false' to boolean
        hide = hide === true || hide === 'true';
        console.log('Toggle tree view, hide:', hide);
        
        if (hide) {
            treeContainer.hide();
            mainContainer.css('flex', '1');
        } else {
            treeContainer.show();
            mainContainer.css('flex', '7');
        }
    },
    setUniqueIds: function(svgElement, widgetId, mainContainer, treeContainer) {
        const prefix = 'svg_' + widgetId + '_';
        let counter = 0;
        const idMap = new Map();

        // Special elements that need reference handling
        const specialElements = [
            'linearGradient',
            'radialGradient',
            'pattern',
            'clipPath',
            'mask',
            'filter',
            'marker',
            'stop'
        ];

        // Reference attributes to update
        const refAttributes = [
            'fill',
            'stroke',
            'clip-path',
            'mask',
            'filter',
            'marker-start',
            'marker-end',
            'marker-mid',
            'xlink:href',
            'href',
            'url'
        ];

        // First pass: Handle special elements first to maintain references
        specialElements.forEach(type => {
            $(svgElement).find(type).each(function() {
                const oldId = $(this).attr('id');
                if (oldId) {
                    const newId = prefix + type.toLowerCase().charAt(0) + counter++;
                    idMap.set(oldId, newId);
                    $(this).attr('id', newId);
                }
            });
        });

        // Second pass: Handle all other elements with IDs
        $(svgElement).find('*[id]').each(function() {
            const oldId = $(this).attr('id');
            if (!idMap.has(oldId)) {
                const tagName = this.tagName.toLowerCase();
                const newId = prefix + tagName + '_' + counter++;
                idMap.set(oldId, newId);
                $(this).attr('id', newId);
            }
        });

        // Third pass: Update all references
        $(svgElement).find('*').each(function() {
            const element = $(this);

            // Update style attribute references
            const style = element.attr('style');
            if (style) {
                let newStyle = style;
                idMap.forEach((newId, oldId) => {
                    newStyle = newStyle.replace(new RegExp('url\\(#' + oldId + '\\)', 'g'), 'url(#' + newId + ')');
                });
                if (style !== newStyle) {
                    element.attr('style', newStyle);
                }
            }

            // Update regular attribute references
            refAttributes.forEach(attr => {
                const value = element.attr(attr);
                if (value) {
                    if (value.includes('url(#')) {
                        const matches = value.match(/url\(#([^)]+)\)/g);
                        if (matches) {
                            let newValue = value;
                            matches.forEach(match => {
                                const oldId = match.slice(5, -1);
                                const newId = idMap.get(oldId);
                                if (newId) {
                                    newValue = newValue.replace(match, `url(#${newId})`);
                                }
                            });
                            if (value !== newValue) {
                                element.attr(attr, newValue);
                            }
                        }
                    } else if (value.startsWith('#')) {
                        const oldId = value.substring(1);
                        const newId = idMap.get(oldId);
                        if (newId) {
                            element.attr(attr, `#${newId}`);
                        }
                    }
                }
            });

            // Special handling for xlink:href
            const xlinkHref = element.attr('xlink:href');
            if (xlinkHref && xlinkHref.startsWith('#')) {
                const oldId = xlinkHref.substring(1);
                const newId = idMap.get(oldId);
                if (newId) {
                    element.attr('xlink:href', `#${newId}`);
                }
            }
        });

        // Update defs references
        $(svgElement).find('defs *').each(function() {
            const element = $(this);
            specialElements.forEach(type => {
                if (this.tagName.toLowerCase() === type) {
                    const oldId = element.attr('id');
                    if (oldId && idMap.has(oldId)) {
                        element.attr('id', idMap.get(oldId));
                    }
                }
            });
        });

        // Get the updated SVG code
        const updatedSvgCode = mainContainer.html();
        
        // Update the widget's data with new SVG code
        if (vis.activeView && vis.views[vis.activeView] && vis.views[vis.activeView].widgets[widgetId]) {
            vis.views[vis.activeView].widgets[widgetId].data.svgCode = updatedSvgCode;
            
            // Trigger save in editor mode
            if (vis.editMode) {
                setTimeout(function() {
                    vis.save();
                }, 50);
            }
        }
        
        // Rebuild tree view to show new IDs
        this.buildTreeView(svgElement, treeContainer, mainContainer);
        
        // Log the ID mappings for debugging
        console.log('ID Mappings:', Object.fromEntries(idMap));
    },
    highlightElement: function(element, mainContainer) {
        // Remove any existing highlights
        $('.element-highlight').remove();
        
        if (!element) return;
        
        // Get element's position and dimensions
        const bbox = element.getBBox();
        const svgElement = $(element).closest('svg')[0];
        const svgRect = svgElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Calculate position relative to the SVG container
        const scale = svgRect.width / svgElement.viewBox.baseVal.width || 1;
        
        // Create highlight element
        const highlight = $('<div class="element-highlight"></div>').css({
            left: (elementRect.left - svgRect.left) + 'px',
            top: (elementRect.top - svgRect.top) + 'px',
            width: elementRect.width + 'px',
            height: elementRect.height + 'px'
        });
        
        // Add highlight to container
        mainContainer.append(highlight);
    },
    buildTreeView: function(svgElement, container, mainContainer) {
        let treeHtml = '';
        const self = this;
        
        function processElement(element, index) {
            const $el = $(element);
            const tagName = element.tagName.toLowerCase();
            const id = $el.attr('id') || '';
            const hasChildren = $el.children().length > 0;
            const elementIndex = index || '';
            
            let itemHtml = '<div class="svg-tree-item' + (hasChildren ? ' has-children' : '') + '" data-element-index="' + elementIndex + '">';
            itemHtml += '<span class="element-type">' + tagName + '</span>';
            if (id) {
                itemHtml += '<span class="element-id">#' + id + '</span>';
            }
            itemHtml += '</div>';
            
            if (hasChildren) {
                itemHtml += '<div class="svg-tree-group">';
                $el.children().each(function(idx) {
                    itemHtml += processElement(this, elementIndex + '_' + idx);
                });
                itemHtml += '</div>';
            }
            
            return itemHtml;
        }
        
        // Create toolbar with Set IDs button
        let toolbarHtml = '<div class="svg-tree-toolbar">';
        toolbarHtml += '<button class="set-ids-button">Set IDs</button>';
        toolbarHtml += '</div>';
        
        // Create content container for tree items
        let contentHtml = '<div class="svg-tree-content">';
        
        // Start with the root SVG element
        contentHtml += processElement(svgElement, '0');
        contentHtml += '</div>';
        
        // Combine toolbar and content
        container.html(toolbarHtml + contentHtml);
        
        // Prevent selection of the widget when clicking tree items
        container.find('.svg-tree-content').on('mousedown mouseup click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        
        // Add click handlers for tree items
        container.find('.svg-tree-item').on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            // Remove previous selection
            container.find('.svg-tree-item').removeClass('selected');
            $(this).addClass('selected');
            
            // Find the corresponding SVG element
            const indexPath = $(this).data('element-index').toString().split('_');
            let targetElement = svgElement;
            
            for (let i = 1; i < indexPath.length; i++) {
                targetElement = $(targetElement).children()[indexPath[i]];
            }
            
            // Highlight the element
            self.highlightElement(targetElement, mainContainer);
            
            return false;
        });
        
        // Add click handler for Set IDs button
        container.find('.set-ids-button').on('click', function(e) {
            e.stopPropagation();
            self.setUniqueIds(svgElement, $(svgElement).closest('.vis-widget').attr('id'), mainContainer, container);
        });
    },
    createWidget: function (widgetID, view, data, style) {
        var $div = $('#' + widgetID);
        var self = this;
        
        // if nothing found => wait
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds["svg_container_with_change_id"].createWidget(widgetID, view, data, style);
            }, 100);
        }

        // Initialize data with defaults if undefined
        data = data || {};
        data.hideTreeView = data.hideTreeView || false;
        data.svgCode = data.svgCode || '';

        // Create wrapper for flex layout
        var wrapper = $('<div class="svg-container-wrapper"></div>');
        
        // Create main SVG container
        var mainContainer = $('<div class="svg-main-container"></div>');
        
        // Create tree view container
        var treeContainer = $('<div class="svg-tree-container"></div>');
        
        // Add containers to wrapper
        wrapper.append(mainContainer).append(treeContainer);
        
        // Add wrapper to widget
        $div.html(wrapper);
        
        // Insert the SVG code and get SVG element
        mainContainer.html(data.svgCode);
        var svgElement = mainContainer.find('svg')[0];
        
        // Store references to containers and SVG element for cleanup
        $div.data('containers', {
            wrapper: wrapper,
            main: mainContainer,
            tree: treeContainer,
            svg: svgElement
        });
        
        // Build tree view after SVG is inserted
        if (data.svgCode && svgElement) {
            // Generate a unique ID for the SVG if it doesn't have one
            if (!$(svgElement).attr('id')) {
                $(svgElement).attr('id', 'svg_' + widgetID);
            }
            this.buildTreeView(svgElement, treeContainer, mainContainer);
        }

        // Set initial visibility based on hideTreeView setting
        this.toggleTreeView(mainContainer, treeContainer, data.hideTreeView);
        
        // Handle hideTreeView changes
        var hideTreeViewState = 'vis-svg_container_with_change_id.' + widgetID + '.hideTreeView';
        vis.states.unbind(hideTreeViewState);  // Unbind first to prevent duplicates
        vis.states.bind(hideTreeViewState, function(e, newVal, oldVal) {
            if ($div.length) {  // Check if widget still exists
                self.toggleTreeView(mainContainer, treeContainer, newVal);
            }
        });
        
        // Handle Set IDs button click
        $div.find('.set-ids-button').off('click').on('click', function() {
            if (!$div.length) return;  // Exit if widget doesn't exist
            
            var containers = $div.data('containers');
            if (!containers || !containers.svg) return;  // Exit if no SVG element
            
            self.setUniqueIds(containers.svg, widgetID, containers.main, containers.tree);
        });
        
        // Store bound states
        $div.data('bound', [hideTreeViewState]);
    },
    
    // Add destroy method to properly clean up
    destroy: function(widgetID) {
        try {
            var $div = $('#' + widgetID);
            if (!$div.length) return;
            
            // Get container references
            var containers = $div.data('containers');
            if (containers) {
                // Remove event handlers
                if (containers.tree) {
                    containers.tree.find('.svg-tree-item').off('click');
                    containers.tree.find('.svg-tree-content').off('mousedown mouseup click');
                }
                
                // Clear SVG element
                if (containers.main) {
                    containers.main.empty();
                }
            }
            
            // Remove Set IDs button click handler
            $div.find('.set-ids-button').off('click');
            
            // Clear bound states
            var bound = $div.data('bound');
            if (bound) {
                bound.forEach(function(id) {
                    vis.states.unbind(id);
                });
            }
            
            // Clear widget content
            $div.empty();
            
            // Clear data
            $div.removeData('bound');
            $div.removeData('containers');
        } catch (e) {
            console.warn('Error during widget destroy:', e);
        }
    }
};

vis.binds["svg_container_with_change_id"].showVersion();
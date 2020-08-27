import { TreeGridComponent, ColumnsDirective, ColumnDirective, Sort, Reorder, Edit, ContextMenu, Resize, Toolbar, Inject, Filter } from '@syncfusion/ej2-react-treegrid';
import { ContextMenuComponent } from '@syncfusion/ej2-react-navigations';
import * as React from 'react';
import './nested-data-crud.css';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';

export default class NestedDataCRUD extends React.Component {
    constructor(props) {
        super(props);
        this.setValidationRules();
        this.setDisplayProperties();
        this.initTreeGrid();
        this.initDataSource();
        this.initNewMenu();
    }

    render() {
        return <div>
            <TreeGridComponent ref={c => this.treeGrid = c} height={this.height}
                                dataSource={this.state.dataSource} treeColumnIndex={1} childMapping={this.childrenField} enableCollapseAll={true}
                                allowReordering='true' allowSorting='true' filterSettings={{ type: 'Menu', hierarchyMode: 'Parent' }} 
                                editSettings={this.editSettings} contextMenuItems={this.contextMenuItems} toolbar={this.toolbarSettings} searchSettings={this.searchSettings}
                                contextMenuOpen={e => this.onOpeningContextMenu(e)} contextMenuClick={e => this.onSelectingMenuItem(e)} toolbarClick={e => this.onClickingOnToolbar(e)}
                                dataBound={e => this.onBindingData(e)} rowSelected={e => this.onSelectingRow(e)} cellEdit={e => this.onEditingCell(e)} cellSave={e => this.afterEditingCell(e)} >
                <ColumnsDirective>
                    <ColumnDirective field='_id' isPrimaryKey={true} visible={false}/>
                    <ColumnDirective field={this.keyField} headerText={this.keyHeader} width='300' validationRules={this.fieldRequired}/>
                    <ColumnDirective field={this.valueField} headerText={this.valueHeader} width='*'/>
                </ColumnsDirective>
                <Inject services={[Sort, Reorder, Edit, ContextMenu, Resize, Toolbar, Filter]}/>
            </TreeGridComponent>
            <ContextMenuComponent ref={c => this.newMenu = c} items={this.newMenuItems} select={e => this.onSelectingMenuItem(e, true)} />
        </div> 
    }

    onEditingCell(e) {
        if (e.columnName === this.valueField && !!e.rowData[this.childrenField]) {
            e.cancel = true;
        }
    }

    afterEditingCell(e) {
        this.updateDataSource(this.state.dataSource);
    }

    onOpeningContextMenu(e) {
        const newMenuItemEl = document.getElementById('newMenuItem')
        const displayNewItem = 
            (!!e.rowInfo.rowData && !!e.rowInfo.rowData[this.childrenField]) ||
            newMenuItemEl.contains(e.rowInfo.target)
        if (displayNewItem) {
            newMenuItemEl.classList.remove("e-menu-hide");
        }
        else {
            newMenuItemEl.classList.add("e-menu-hide");
        }
        const contextMenuEl = document.getElementById('_gridcontrol_cmenu');
        if (!!contextMenuEl && !!contextMenuEl.childNodes && [...(contextMenuEl.childNodes)].every(e => e.classList.contains('e-menu-hide'))) {
            e.cancel = true;
        }
    }

    onSelectingMenuItem(e, fromToolbar = false) {
        if (e.item.id === 'addNode' || e.item.id === 'addLeaf') {
            this.addingRow = true;
            this.nodeIndex = fromToolbar ? -1 : this.treeGrid.getSelectedRowIndexes()[0]
            const root = { _id: 'root' }
            root[this.childrenField] = this.state.dataSource.map(e => e);
            const nodeId = fromToolbar ? 'root' : this.treeGrid.getSelectedRecords()[0]._id;
            const node = this.getItemById(nodeId, root)
            const newRecord = { _id: uuid() };
            if (e.item.id === 'addLeaf') {
                newRecord[this.keyField] = `New ${this.leafLabel}`;
                newRecord[this.valueField] = `New ${this.valueHeader}`;
            }
            else {
                newRecord[this.keyField] = `New ${this.nodeLabel}`;
                newRecord[this.childrenField] = [];
            }
            node[this.childrenField].unshift(newRecord);
            this.expandedNodeIds = this.treeGrid.getRows().filter(e => e.ariaExpanded === 'true').map(e => e.cells[0].innerText);
            this.updateDataSource(root[this.childrenField]);
        }
    }

    onBindingData(e) {
        if (this.addingRow) {
            this.treeGrid.selectRow(this.nodeIndex + 1);
        }
    }

    onSelectingRow(e) {
        if (this.addingRow) {
            const rows = this.treeGrid.getRows();
            if (!!e.data.parentItem) {
                const parentRow = rows.find(r => r.cells[0].innerText == e.data.parentItem._id);
                this.treeGrid.expandRow(parentRow);
            }
            rows.forEach(r => {
                if (this.expandedNodeIds.includes(r.cells[0].innerText)) {
                    this.treeGrid.expandRow(r);
                }
            });
            this.expandedNodeIds = null;
            this.addingRow = false;
        }
    }
    
    onClickingOnToolbar(e) {
        if (e.item.id === 'newToolbarButton') {
            const newToolbarButton = document.getElementById(e.item.id);
            const rect = newToolbarButton.getBoundingClientRect()
            this.newMenu.open(rect.x, rect.y);
        }
    }

    initTreeGrid() {
        this.setEditSettings();
        this.setContextMenuItems();
        this.setToolbarSettings();
        this.setSearchSettings()
        this.mapDataFields();
        this.height = this.props.height || 500;
    }

    setEditSettings() {
        this.editSettings = {
            allowAdding: true,
            allowDeleting: true,
            allowEditing: true,
            mode: 'Cell',
            newRowPosition: 'Below',
        };
    }

    setContextMenuItems() {
        this.contextMenuItems = [
            'AutoFit',
            'AutoFitAll',
            'SortAscending',
            'SortDescending',
            'Delete',
            {
                id: 'newMenuItem',
                text: 'New',
                iconCss: 'e-icons e-add',
                items: [
                    { id: 'addNode', text: this.nodeLabel },
                    { id: 'addLeaf', text: this.leafLabel }
                ]
            },
        ];
    }

    setToolbarSettings() {
        this.toolbarSettings = [
            { id: 'newToolbarButton', text: 'New', prefixIcon: 'e-add' },
            'Cancel',
            { type: 'Separator' },
            'Search',
            'ExpandAll',
            'CollapseAll',
        ];
    }

    setSearchSettings() {
        this.searchSettings = {
            hierarchyMode: 'Both'
        }
    }

    mapDataFields() {
        this.keyField = this.props.keyField || 'key';
        this.valueField = this.props.valueField || 'value';
        this.childrenField = this.props.childrenField || 'children';
    }

    initNewMenu() {
        this.newMenuItems = [
            { id: 'addNode', text: this.nodeLabel },
            { id: 'addLeaf', text: this.leafLabel },
        ];
    }

    setValidationRules() {
        this.fieldRequired = { required: true };
    }

    initDataSource() {
        let dataSource = this.props.dataSource || [];
        dataSource = this.addIds(dataSource);
        dataSource = dataSource.map(e => { return { _id: uuid(), ...e }; });
        this.state = {
            dataSource
        }
    }

    setDisplayProperties() {
        this.keyHeader = this.props.keyHeader || 'Key';
        this.valueHeader = this.props.valueHeader || 'Value';
        this.nodeLabel = this.props.nodeLabel || 'Node';
        this.leafLabel = this.props.leafLabel || 'Leaf';
    }

    addIds(items) {
        items.forEach(e => {
            if (!!e[this.childrenField]) {
                e[this.childrenField] = this.addIds(e[this.childrenField])
            }
        });
        return items.map(e => { return { _id: uuid(), ...e }; });
    }

    getItemById(id, root) {
        if (root._id == id) {
            return root;
        }
        if (!!root[this.childrenField]) {
            for (let i = 0; i < root[this.childrenField].length; i++) {
                const item = this.getItemById(id, root[this.childrenField][i]);
                if (!!item) {
                    return item;
                }
            }
        }
        return null;
    }

    updateDataSource(dataSource) {
        this.setState({ dataSource });
        if (!!this.props.setProps) {
            this.props.setProps({ dataSource });
        }
    }
}

NestedDataCRUD.defaultProps = {};

NestedDataCRUD.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,
    dataSource: PropTypes.arrayOf(PropTypes.object),
    keyField: PropTypes.string,
    keyHeader: PropTypes.string,
    valueField: PropTypes.string,
    valueHeader: PropTypes.string,
    childrenField: PropTypes.string,
    nodeLabel: PropTypes.string,
    leafLabel: PropTypes.string,
    height: PropTypes.number
};
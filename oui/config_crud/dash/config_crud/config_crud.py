import os
import dash
import dash_html_components as html
from dash.dependencies import Input, Output
from config_crud.config_store import ConfigStore
from nested_data_crud import NestedDataCRUD

class ConfigCRUD:
    SUPPORTED_CONFIG_FORMATS = ['ini', 'json', 'toml', 'xml', 'yaml']

    def __init__(self, id, root_path, height=800):
        self.id = id
        self.store = ConfigStore(path_format=root_path)
        self.height = height
        self._parse_data()

    def _parse_data(self):
        self._data_source = []
        root = { 'children': self._data_source }
        for file_path in self.store:
            file_format = os.path.splitext(file_path)[1][1:]
            if file_format in ConfigCRUD.SUPPORTED_CONFIG_FORMATS:
                path_parts = file_path.split(os.path.sep)
                self._insert_config_path_to_data_source(self.store[file_path], path_parts, root)

    def _insert_config_path_to_data_source(self, data, path_parts, node):
        self._init_node_children(node)
        key = path_parts[0]
        sub_node_arr = [x for x in node['children'] if x['key'] == key]
        if len(sub_node_arr) == 0:
            sub_node = self._add_new_node(key, node)
        else:
            sub_node = sub_node_arr[0]

        if len(path_parts) > 1:
            self._insert_config_path_to_data_source(data, path_parts[1:], sub_node)
        else:
            self._insert_config_data_to_data_source(data, sub_node)

    def _insert_config_data_to_data_source(self, data, node):
        self._init_node_children(node)
        for key in data:
            if isinstance(data[key], dict):
                sub_node = self._add_new_node(key, node)
                self._insert_config_data_to_data_source(data[key], sub_node)
            else:
                self._add_new_leaf(key, data[key], node)

    def _init_node_children(self, node):
        if 'children' not in node.keys():
            node['children'] = []

    def _add_new_node(self, node_key, parent_node):
        node = { 'key': node_key }
        parent_node['children'].append(node)
        # parent_node['children'].sort(key=lambda x: x['key'])
        return node

    def _add_new_leaf(self, leaf_key, leaf_value, parent_node):
        leaf = { 'key': leaf_key, 'value': leaf_value }
        parent_node['children'].append(leaf)
        # parent_node['children'].sort(key=lambda x: x['key'])

    def _store_data(self):
        root = { 'key': '', 'children': self._data_source }
        self._store_items(self._data_source, '')
                
    def _store_items(self, items, root_path):
        for item in items:
            item_path = item['key']
            if root_path:
                item_path = root_path + os.path.sep + item_path
            file_format = os.path.splitext(item_path)[1][1:]
            if 'children' in item.keys():
                if file_format in ConfigCRUD.SUPPORTED_CONFIG_FORMATS:
                    config_obj = self._get_obj(item['children'])
                    config_obj['_format'] = file_format
                    self.store[item_path] = config_obj
                else:
                    self._store_items(item['children'], item_path)
            else:
                raise Error('Invalid leaf: {}', item_path)

    def _get_obj(self, items):
        obj = {}
        for item in items:
            if 'value' in item.keys():
                obj[item['key']] = item['value']
            else:
                obj[item['key']] = self._get_obj(item['children'])
        return obj

    def get_layout(self):
        return html.Div([
            NestedDataCRUD(
                id=self.id,
                dataSource=self._data_source,
                nodeLabel='Section',
                leafLabel='Item',
                height=self.height
            ),
            html.Div(id='hidden-div', style={'display':'none'})
        ])

    def configure_callbacks(self, app):
        @app.callback(
            Output('hidden-div', 'className'),
            [Input(self.id, 'dataSource')]
        )
        def on_data_changed(data_source):
            self._data_source = data_source
            self._store_data()
            return ''

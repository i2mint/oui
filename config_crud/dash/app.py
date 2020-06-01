import dash
import dash_core_components as dcc
import dash_html_components as html
from config_crud.config_crud import ConfigCRUD

config_crud = ConfigCRUD(
    id='my-config-crud',
    root_path='../../data/config_files'
)
app = dash.Dash(__name__)
app.layout = config_crud.get_layout
config_crud.configure_callbacks(app)
if __name__ == '__main__':
    app.run_server(debug=True, port=8050)
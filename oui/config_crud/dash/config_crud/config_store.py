import json
import anymarkup
from py2store.stores.local_store import RelativePathFormatStoreEnforcingFormat as LocalFileStore

class ConfigStore(LocalFileStore):
    
    def _obj_of_data(self, data):
        return anymarkup.parse(data)
    
    def _data_of_obj(self, obj):
        file_format = obj['_format']
        del obj['_format']
        return anymarkup.serialize(obj, file_format).decode("utf-8")
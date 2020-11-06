class ModuleNotFoundIgnore:
    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is ModuleNotFoundError:
            pass
        return True


class ModuleNotFoundManager:
    """(Context) managing ModuleNotFoundErrors (ignore, log, or other creative uses...)

    Specifying no arguments will result in ignoring whole block silently

    >>> with ModuleNotFoundManager():
    ...     import i_do_not_exist

    Specifying a message will result in calling the log_func (default is ``print``) with msg as the argument.

    >>> with ModuleNotFoundManager("That module does not exist"):
    ...     import i_do_not_exist.either
    That module does not exist

    """

    def __init__(self, msg=None, log_func=print):
        self.msg = msg
        self.log_func = log_func

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is ModuleNotFoundError:
            if self.msg is not None:
                self.log_func(self.msg)
        return True

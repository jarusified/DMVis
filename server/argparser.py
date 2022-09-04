import argparse
from server.logger import get_logger

LOGGER = get_logger(__name__)


class ArgParser:
    """
    Argparser class decodes the arguments passed to
    """

    def __init__(self, args_string):

        assert isinstance(args_string, list)

        # Parse the arguments passed.
        self.parser = ArgParser._create_parser()
        self.args = vars(self.parser.parse_args())

        # Verify if only valid things are passed.
        self._verify_parser()
        LOGGER.info(f"Arguments verified.")

    def __str__(self):
        items = ("%s = %r" % (k, v) for k, v in self.__dict__.items())
        return "<%s: {%s}> \n" % (self.__class__.__name__, ", ".join(items))

    def __repr__(self):
        return self.__str__()

    # --------------------------------------------------------------------------
    # Private methods.
    @staticmethod
    def _create_parser():
        """
        Parse the input arguments.
        """
        parser = argparse.ArgumentParser(prefix_chars="--")
        parser.add_argument(
            "--http",
            help="Server mode -- Spawns a http server on specified port",
            type=int,
            required=False,
        )
        parser.add_argument(
            "--data_dir", help="Data directory path", type=str, required=True
        )
        return parser

    def _verify_parser(self):
        """
        Verify the input arguments.

        Raises expections if something is not provided
        Check if the config file is provided and exists!

        :pargs : argparse.Namespace
            Arguments passed by the user.

        Returns
        -------
        """

        _has_data_dir = self.args["data_dir"] is not None

        if not _has_data_dir:
            LOGGER.error(f"Option --data_dir not provided.")
            self.parser.print_help()
            exit(1)

        return

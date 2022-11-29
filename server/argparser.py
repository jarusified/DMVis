import argparse
from server.logger import get_logger

LOGGER = get_logger(__name__)
ALLOWED_FORMATS = ["JIT", "SNPROF", "KINETO"]


class ArgParser:
    """
    Argparser class decodes the arguments passed using the cmd line interface.
    """

    def __init__(self, args_string):
        assert isinstance(args_string, list)

        # Parse the arguments passed.
        self.parser = ArgParser._create_parser()
        self.args = vars(self.parser.parse_args())

        # Verify if only valid things are passed.
        self._verify_parser()
        LOGGER.info(f"Command args verified!")

    def __str__(self):
        items = ("%s = %r" % (k, v) for k, v in self.__dict__.items())
        return "<%s: {%s}> \n" % (self.__class__.__name__, ", ".join(items))

    def __repr__(self):
        return self.__str__()

    @staticmethod
    def _create_parser():
        """
        Parse the input arguments.

        :params: None
        :return: None
        """
        parser = argparse.ArgumentParser(prefix_chars="--")
        parser.add_argument(
            "--data_dir", help="Performance directory path", type=str, required=False
        )
        parser.add_argument(
            "--format",
            help="Timeline trace format: allowed = ['JIT', 'SNPROF', 'KINETO'].",
            type=str,
            required=False,
        )
        return parser

    def _verify_parser(self):
        """
        Verify the input arguments.

        Raises expections if something is not provided

        :params: None
        :return: None
        """

        _has_data_dir = self.args["data_dir"] is not None

        # if not _has_data_dir:
        #     LOGGER.error(f"Option --data_dir not provided.")
        #     self.parser.print_help()
        #     exit(1)

        # _has_format = self.args["format"]

        # if _has_format not in ALLOWED_FORMATS:
        #     LOGGER.error(f"Invalid timeline format provided.")
        #     self.parser.print_help()
        #     exit(1)

        return

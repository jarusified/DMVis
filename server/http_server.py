import os
import pathlib
import warnings

from flask import Flask, json, jsonify, request
from flask_cors import CORS, cross_origin

from server.logger import get_logger
from server.datasets import Datasets
from server.utils import create_dir_after_check

# Globals
FOLDER_PATH = os.path.abspath(os.path.dirname(__file__))
STATIC_FOLDER_PATH = os.path.join(FOLDER_PATH, "static")
DEFAULT_SORT_EXPERIMENTS = "EVENT_COUNT"
LOGGER = get_logger(__name__)

# Create a Flask server.
app = Flask(__name__, static_url_path="/static")

# Enable CORS
cors = CORS(app, automatic_options=True)
app.config["CORS_HEADERS"] = "Content-Type"


class HTTPServer:
    """
    HTTP Server Class.
    """

    def __init__(self, args):
        LOGGER.info(f"{type(self).__name__} mode enabled.")
        self.data_dir = os.path.abspath(args.args["data_dir"])

        self.project_dir = pathlib.Path(__file__).parent.parent.resolve()
        self.out_dir = os.path.join(self.project_dir, ".nova")
        create_dir_after_check(self.out_dir)
        LOGGER.info(f"Client data files will be dumped at {self.out_dir}")

        # Check if the directory exists.
        HTTPServer._check_data_dir_exists(self.data_dir)

        self.experiments = os.listdir(self.data_dir)
        self.profile_format = args.args["format"]
        LOGGER.info(f"PROFILE FORMAT: {self.profile_format}")
        self.handle_routes()

    @staticmethod
    def _check_data_dir_exists(data_dir: str):
        """
        Internal method to check if the data_dir exists.
        If not present, raise an exception and exit the program.

        :param data_dir: path to check if it exists.
        :return: None
        """
        _is_dir = os.path.exists(data_dir)

        if not _is_dir:
            message = f"It looks like {data_dir} is an invalid directory."
            LOGGER.error(message)
            exit(1)

    def load(self) -> None:
        """
        External method to allow `http_server.py` to load the Datasets.

        :return: None
        """
        self.profiles = Datasets(
            data_dir=self.data_dir, profile_format=self.profile_format
        )
        self.timeline = None

    def start(self, host: str, port: int) -> None:
        """
        Launch the Flask application.

        :param host: host to run API server
        :param port: port to run API server
        :return: None
        """
        LOGGER.info("Starting the API service")
        app.run(host=host, port=port, threaded=True, debug=True)

    @staticmethod
    def emit_json(endpoint: str, json_data: any) -> str:
        """
        Emit the json data to the endpoint

        :param endpoint: Endpoint to emit information to.
        :param json_data: Data to emit to the endpoint
        :return response: Response packed with data (in JSON format).
        """
        try:
            response = app.response_class(
                response=json.dumps(json_data),
                status=200,
                mimetype="application/json",
            )
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response
        except ValueError:
            warnings.warn(f"[API: {endpoint}] emits no data.")
            return jsonify(isError=True, message="Error", statusCode=500)

    def handle_routes(self):
        @app.route("/")
        @cross_origin()
        def index():
            """
            Route to send the `index.html` file.
            """
            return app.send_static_file("index.html")

        @app.route("/fetch_experiments", methods=["GET"])
        @cross_origin()
        def fetch_experiments():
            """
            Route to fetch experiments sorted based on the EVENT_COUNT or START_TIMESTAMP.
            """
            if DEFAULT_SORT_EXPERIMENTS == "EVENT_COUNT":
                sorted_experiments = self.profiles.sort_by_event_count()
            elif DEFAULT_SORT_EXPERIMENTS == "START_TIMESTAMP":
                sorted_experiments = self.profiles.sort_by_date()
            return jsonify(experiments=sorted_experiments, dataDir=self.data_dir)

        @app.route("/set_experiment", methods=["POST"])
        @cross_origin()
        def set_experiment():
            """
            Route to update the experiment that the user selected. This method
            TODO: Refactor metadata to a separate request and update this HTTP method to just an "UPDATE" request.
            """
            request_context = request.json
            if "experiment" not in request_context:
                LOGGER.error("Invalid Request! experiment field missing.")
            experiment = request_context["experiment"]
            self.timeline = self.profiles.get_profile(experiment)
            metadata = self.timeline.get_metadata(experiment)
            return jsonify(metadata)

        @app.route("/fetch_timeline", methods=["POST"])
        @cross_origin()
        def fetch_timeline_detailed():
            """
            Route to fetch the current timeline.
            TODO: Move the dumped data to a .dot folder.
            """
            if self.timeline is not None:
                request_context = request.json
                window_start = request_context["window_start"]
                window_end = request_context["window_end"]
                timeline = self.timeline.get_timeline(window_start, window_end)
                timeline_path = os.path.join(
                    self.out_dir, "nova_timeline_detailed.json"
                )
                with open(timeline_path, "w") as outfile:
                    json.dump(timeline, outfile)
                return jsonify(timeline)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_summary", methods=["POST"])
        @cross_origin()
        def fetch_timeline_summary():
            """
            Route to fetch the summary timeline (histogram-bin plotting of events).
            """
            if self.timeline is not None:
                request_context = request.json
                sample_count = request_context["sample_count"]
                summary = self.timeline.get_summary(sample_count=sample_count)
                summary_path = os.path.join(self.out_dir, "nova_timeline_summary.json")
                with open(summary_path, "w") as outfile:
                    json.dump(summary, outfile)
                return jsonify(summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_event_summary", methods=["GET"])
        @cross_origin()
        def fetch_event_summary():
            """
            Route to fetch the summary for all range-events in the timeline.
            """
            if self.timeline is not None:
                event_summary = self.timeline.get_event_summary(["range"])
                event_summary_path = os.path.join(
                    self.out_dir, "nova_event_summary.json"
                )
                with open(event_summary_path, "w") as outfile:
                    json.dump(event_summary, outfile)
                return jsonify(event_summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_background_summary", methods=["GET"])
        @cross_origin()
        def fetch_background_summary():
            """
            Route to fetch the summary for all background-events in the timeline.
            TODO: Currently this view has been disabled. Need to update logic to realize there is a background event and only visualize this if such information exists.
            """
            if self.timeline is not None:
                bkg_summary = self.timeline.get_event_summary(["background"])
                return jsonify(bkg_summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

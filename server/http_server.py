from audioop import cross
import os
import pathlib
import warnings

from flask import Flask, json, jsonify, request, send_from_directory
from flask_cors import CORS, cross_origin

from server.logger import get_logger
from server.datasets import Datasets
from server.utils import create_dir_after_check, load_json

# Globals
FOLDER_PATH = os.path.abspath(os.path.dirname(__file__))
STATIC_FOLDER_PATH = os.path.join(FOLDER_PATH, "static")
DEFAULT_SORT_EXPERIMENTS = "START_TIMESTAMP"
LOGGER = get_logger(__name__)
DEV_MODE = True

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
        self.args = args
        LOGGER.info(f"{type(self).__name__} mode enabled.")

        self.examples = {
            "sgemm-kernel-opt": "./paper-data/sgemm-kernel-opt",
            "sgemm-uvm-opt": "./paper-data/gemm-uvm",
            "comb-post-send-1_1_1": "./paper-data/comb-post-send-1_1_1",
            "comb-post-send-1024_1024_1024": "./paper-data/comb-post-send-1024_1024_1024",
            "comb-post-send-wait-all-scale-up": "./paper-data/comb-post-send-wait-all-scale-up"
        }
        
        self.handle_routes()
        if args['data_dir']:
            self.is_args_data_dir = True


    def load(self, data_dir: str, profile_format: str = "DMV"):
        """
        Load the data directory.
        """
        self.data_dir = os.path.abspath(data_dir)

        self.project_dir = pathlib.Path(__file__).parent.parent.resolve()
        self.static_dir = os.path.join(self.project_dir, "static")
        self.dot_dmv_dir = os.path.join(self.project_dir, ".dmv")

        if(DEV_MODE): 
            create_dir_after_check(self.dot_dmv_dir)
            LOGGER.info(f"dev files will be dumped at {self.dot_dmv_dir}")

        # Check if the directory exists.
        HTTPServer._check_data_dir_exists(self.data_dir)

        self.experiments = os.listdir(self.data_dir)
        self.experiment = ""
        self.profiles = Datasets(
            data_dir=self.data_dir, profile_format=profile_format
        )
        self.timeline = None

        return True

    def _dump_http_responses(self, json_data, file_name):

        _path = os.path.join(self.dot_dmv_dir, file_name)
        with open(_path, "w") as outfile:
            json.dump(json_data, outfile)

        LOGGER.info(f"Dumped http respnse to {file_name}")

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


        @app.route("/load_example", methods=["POST"])
        @cross_origin()
        def load_example():
            """
            Route to load examples.
            """
            request_context = request.json

            if(self.is_args_data_dir):
                status = self.load(data_dir=self.args["data_dir"], profile_format="DMV")
            else:
                example = request_context["example"]
                status = self.load(data_dir=self.examples[example], profile_format="DMV")
            if DEV_MODE: self._dump_http_responses(status, "load_example.json")
            return jsonify(status=status)

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
            if DEV_MODE: self._dump_http_responses(sorted_experiments, "fetch_experiments.json")
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
            self.experiment = request_context["experiment"]
            self.timeline = self.profiles.get_profile(self.experiment)
            metadata = self.timeline.get_metadata(self.experiment)
            if DEV_MODE: self._dump_http_responses(metadata, "set_experiment.json")

            return jsonify(metadata)

        @app.route("/fetch_timeline", methods=["POST"])
        @cross_origin()
        def fetch_timeline_detailed():
            """
            Route to fetch the current timeline.
            """
            if self.timeline is not None:
                request_context = request.json
                window_start = request_context["window_start"]
                window_end = request_context["window_end"]
                timeline = self.timeline.get_timeline(window_start, window_end)
                if DEV_MODE: self._dump_http_responses(timeline, "fetch_timeline.json")

                return jsonify(timeline)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_ensemble_summary", methods=["POST"])
        @cross_origin()
        def fetch_ensemble_summary():
            all_timelines = self.profiles.get_all_profiles()
            ind_info = {}
            for (exp, timeline) in all_timelines.items():
                ind_info[exp] = timeline.get_summary(sample_count=12)

            ensemble_info = {
                "runtime_range": self.profiles.max_min_runtime(),
                "rel_binning": self.profiles.get_summary(sample_count=12)
            }
            payload = {
                'individual': ind_info,
                'ensemble': ensemble_info
            }
            if DEV_MODE: self._dump_http_responses(payload, "fetch_ensemble_summary.json")
            return jsonify(payload)


        @app.route("/fetch_summary", methods=["POST"])
        @cross_origin()
        def fetch_summary():
            """
            Route to fetch the summary timeline (histogram-bin plotting of events).
            """
            if self.timeline is not None:
                request_context = request.json
                sample_count = request_context["sample_count"]
                summary = self.timeline.get_summary(sample_count=sample_count)

                if DEV_MODE: self._dump_http_responses(summary, "fetch_summary.json")
                return jsonify(summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_timeline_summary", methods=["GET"])
        @cross_origin()
        def fetch_timeline_summary():
            """
            Route to fetch the summary for all range-events in the timeline.
            """
            if self.timeline is not None:
                timeline_summary = self.timeline.get_timeline_summary(
                    ["range", "x-range"]
                )
                if DEV_MODE: self._dump_http_responses(timeline_summary, "fetch_timeline_summary.json")

                return jsonify(timeline_summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_event_summary", methods=["POST"])
        @cross_origin()
        def fetch_event_summary():
            """
            Route to fetch the summary for all range-events in the timeline.
            """
            if self.timeline is not None:
                request_context = request.json
                event_groups = request_context["groups"]
                event_summary = self.timeline.get_event_summary(
                    event_groups, ["range", "x-range"]
                )
                if DEV_MODE: self._dump_http_responses(event_summary, "fetch_event_summary.json")
                return jsonify(event_summary)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/static/topology.svg", methods=["GET"])
        @cross_origin()
        def serve_topology():
            import base64

            file_path = os.path.join(self.data_dir, f"{self.experiment}.svg")
            if not os.path.exists(file_path):
                file_path = os.path.join(self.static_dir, "topology-default.svg")

            with open(file_path, "rb") as image_file:
                ret = base64.b64encode(image_file.read())
            return ret

        @app.route("/fetch_cct", methods=["GET"])
        @cross_origin()
        def fetch_cct():
            cct_path = os.path.join(self.out_dir, "cct.json")

            cct = load_json(file_path=cct_path)
            return jsonify(cct)

        @app.route("/fetch_window", methods=["POST"])
        @cross_origin()
        def get_window_detailed():
            """
            Route to fetch the data within a given window (i.e., between
            window_start and window_end).
            """
            if self.timeline is not None:
                request_context = request.json
                window_start = request_context["window_start"]
                window_end = request_context["window_end"]
                events = self.timeline.get_window(window_start, window_end)
                return jsonify(events)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})

        @app.route("/fetch_metrics_timeline", methods=["POST"])
        @cross_origin()
        def get_metrics_timeline():
            if self.timeline is not None:
                request_context = request.json
                metrics_timeline = self.timeline.get_metrics()
                return jsonify(metrics_timeline)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})
        
        @app.route("/fetch_metrics_timeline_window", methods=["POST"])
        @cross_origin()
        def get_metrics_timeline_window():
            if self.timeline is not None:
                request_context = request.json
                window_start = request_context["window_start"]
                window_end = request_context["window_end"]
                metrics_timeline = self.timeline.get_metrics_by_window(window_start, window_end)
                return jsonify(metrics_timeline)
            else:
                LOGGER.info("Returned empty JSON. `self.timeline` not defined. Error!")
                return jsonify({})
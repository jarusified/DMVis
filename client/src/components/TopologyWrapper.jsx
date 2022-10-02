import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import ReactHtmlParser from "react-html-parser";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";

import { fetchTopology } from "../actions";

const useStyles = makeStyles((theme) => ({
	svg: {
		height: "300px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function MetadataWrapper() {
	const classes = useStyles();
	const dispatch = useDispatch();

	const topology = useSelector((store) => store.topology);

	useEffect(() => {
		if (topology.length == 0) {
			dispatch(fetchTopology());
		}
	});

	useEffect(() => {
		if (topology.length > 0) {
			const img = document.getElementById("topology");
			img.src = "data:image/svg+xml;base64," + topology;
		}
	}, [topology]);

	return (
		<Paper>
			<Zoom>
				<img id="topology" alt="" width={window.innerWidth / 4 - 40} />
			</Zoom>

			{/* {ReactHtmlParser(topology)} */}
		</Paper>
	);
}
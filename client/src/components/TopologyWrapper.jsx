import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import ReactHtmlParser from "react-html-parser";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";

import { fetchTopology } from "../actions";
import cpu from "./a.svg";

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
			console.log(topology);
			const img = document.querySelector('img');
			// img.src = "data:image/svg+xml;charset=utf-8," + topology
		}
	}, [topology]);

	return (
		<Paper>
			<Grid>
				<Zoom>
					<img alt="" 
						src={cpu} 
						width={window.innerWidth/2 - 40} />
				</Zoom>

				{/* {ReactHtmlParser(topology)} */}
			</Grid>
		</Paper>
	);
}

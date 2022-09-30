import { Paper, Typography } from "@material-ui/core";
import Grid from '@mui/material/Grid';
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";

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

	const topology = useSelector((store) => store.topology);

	useEffect(() => {}, [topology]);

	return (
		<Paper>
			<Grid>
				<Zoom>
					<img
						alt=""
						src={cpu}
						width="500"
					/>
				</Zoom>
			</Grid>
		</Paper>
	);
}

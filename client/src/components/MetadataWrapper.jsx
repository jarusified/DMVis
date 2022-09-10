import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const useStyles = makeStyles((theme) => ({
	scroll: {
		height: "100px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function MetadataWrapper() {
	const classes = useStyles();

	const profileMetadata = useSelector((store) => store.profileMetadata);

	useEffect(() => {
		if (profileMetadata.length > 0) {
			console.log("Metadata view:" + profileMetadata);
		}
	}, [profileMetadata]);

	return (
		<Paper>
			<Typography variant="overline" style={{ fontWeight: "bold" }}>
				Metadata
			</Typography>

			{profileMetadata.length > 0 ? (
				<TableContainer
					component={Paper}
					sx={{ minWidth: 150, maxHeight: 250 }}
				>
					<Table
						size="small"
						aria-label="metadata table"
						className={classes.scroll}
					>
						<TableBody>
							{profileMetadata.map((row) => (
								<TableRow
									key={row.name}
									sx={{
										"&:last-child td, &:last-child th": {
											border: 0
										}
									}}
								>
									<TableCell component="th" scope="row">
										{row.name}
									</TableCell>
									<TableCell align="right">
										{row.key}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			) : (
				<></>
			)}
		</Paper>
	);
}
